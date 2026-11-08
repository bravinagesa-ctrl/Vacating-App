import hmac
import logging
from datetime import timedelta

from django.conf import settings
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from integrations.mpesa import MpesaError, stk_push
from integrations.phone import normalize_phone
from listings.models import Listing

from .models import Payment
from .serializers import PaymentSerializer

log = logging.getLogger(__name__)


class StkPushView(APIView):
    """Landlord pays to feature a listing. Body: {"listing_id": 1, "phone": "0712345678"}"""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        listing = get_object_or_404(Listing, pk=request.data.get("listing_id"))
        if listing.owner_id != request.user.id and request.user.role != "admin":
            return Response({"detail": "You can only feature your own listings."}, status=403)
        try:
            phone = normalize_phone(request.data.get("phone", ""))
        except ValueError as exc:
            return Response({"phone": [str(exc)]}, status=400)

        payment = Payment.objects.create(
            user=request.user, listing=listing, phone=phone, amount=settings.FEATURED_LISTING_FEE_KES
        )
        try:
            data = stk_push(phone, payment.amount, f"HAMA{listing.id}", "Feature ad")
        except MpesaError as exc:
            payment.status = Payment.Status.FAILED
            payment.result_desc = str(exc)[:255]
            payment.save(update_fields=["status", "result_desc"])
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        payment.checkout_request_id = data.get("CheckoutRequestID")
        payment.merchant_request_id = data.get("MerchantRequestID", "")
        payment.save(update_fields=["checkout_request_id", "merchant_request_id"])
        return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED)


class PaymentDetailView(generics.RetrieveAPIView):
    """Used by the frontend to poll until the payment is success or failed."""

    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Payment.objects.filter(user=self.request.user)


class MpesaCallbackView(APIView):
    """Safaricom posts the STK result here. The secret token in the URL is the only auth."""

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = []

    def post(self, request, token):
        expected = settings.MPESA_CALLBACK_TOKEN
        if not expected or not hmac.compare_digest(token, expected):
            return Response(status=status.HTTP_404_NOT_FOUND)

        callback = (request.data.get("Body") or {}).get("stkCallback") or {}
        checkout_id = callback.get("CheckoutRequestID")
        result_code = callback.get("ResultCode")
        ack = Response({"ResultCode": 0, "ResultDesc": "Accepted"})

        with transaction.atomic():
            payment = Payment.objects.select_for_update().filter(checkout_request_id=checkout_id).first()
            if payment is None or payment.status != Payment.Status.PENDING:
                return ack  # unknown or already processed (callbacks can be retried)

            payment.result_desc = str(callback.get("ResultDesc", ""))[:255]
            if result_code == 0:
                items = {
                    item.get("Name"): item.get("Value")
                    for item in (callback.get("CallbackMetadata") or {}).get("Item", [])
                }
                paid = items.get("Amount") or 0
                if paid < payment.amount:
                    payment.status = Payment.Status.FAILED
                    payment.result_desc = "Amount paid was less than the fee."
                else:
                    payment.status = Payment.Status.SUCCESS
                    payment.mpesa_receipt = str(items.get("MpesaReceiptNumber", ""))[:40]
                    listing = payment.listing
                    start = max(timezone.now(), listing.featured_until or timezone.now())
                    listing.featured_until = start + timedelta(days=settings.FEATURED_LISTING_DAYS)
                    listing.save(update_fields=["featured_until"])
            else:
                payment.status = Payment.Status.FAILED
            payment.save()
        return ack
