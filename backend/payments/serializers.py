from rest_framework import serializers

from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ["id", "listing", "amount", "status", "mpesa_receipt", "result_desc", "created_at"]
