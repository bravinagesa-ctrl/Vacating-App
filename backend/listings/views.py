from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.geos import Point, Polygon
from django.contrib.gis.measure import D
from django.db.models import Case, Count, IntegerField, Q, Value, When
from django.utils import timezone
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend

from integrations import geocoding
from integrations.sms import send_sms

from .filters import ListingFilter
from .models import Area, Inquiry, Listing, SavedListing
from .permissions import CanPostListings, IsOwnerOrAdmin
from .serializers import AreaSerializer, InquirySerializer, ListingImageSerializer, ListingSerializer

MAX_PHOTOS = 8


class AreaViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AreaSerializer
    permission_classes = [AllowAny]
    pagination_class = None
    lookup_field = "slug"

    def get_queryset(self):
        return Area.objects.annotate(
            listing_count=Count("listings", filter=Q(listings__is_available=True))
        ).order_by("-listing_count", "name")


class ListingViewSet(viewsets.ModelViewSet):
    serializer_class = ListingSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_class = ListingFilter
    search_fields = ["title", "address_text", "area__name", "description"]
    ordering_fields = ["price_kes", "created_at"]
    throttle_scope = None  # required so the `inquire` action can set its own scope

    # ----- permissions -----
    def get_permissions(self):
        if self.action in ("list", "retrieve", "inquire"):
            return [AllowAny()]
        if self.action == "create":
            return [IsAuthenticated(), CanPostListings()]
        if self.action in ("update", "partial_update", "destroy", "images"):
            return [IsAuthenticated(), IsOwnerOrAdmin()]
        return [IsAuthenticated()]

    # ----- queryset -----
    def get_queryset(self):
        qs = Listing.objects.select_related("area", "owner").prefetch_related("images")
        if self.action == "mine":
            return qs.filter(owner=self.request.user).order_by("-created_at")
        if self.action == "saved":
            return qs.filter(saved_by__user=self.request.user).order_by("-saved_by__created_at")
        if self.action != "list":
            return qs

        qs = qs.filter(is_available=True)
        params = self.request.query_params
        bbox = params.get("bbox")  # minLng,minLat,maxLng,maxLat
        lat, lng = params.get("lat"), params.get("lng")

        if bbox:
            try:
                min_lng, min_lat, max_lng, max_lat = (float(x) for x in bbox.split(","))
                qs = qs.filter(location__within=Polygon.from_bbox((min_lng, min_lat, max_lng, max_lat)))
            except ValueError:
                pass
        elif lat and lng:
            try:
                origin = Point(float(lng), float(lat), srid=4326)
                radius = min(float(params.get("radius_km", 3)), 50)
                qs = (
                    qs.filter(location__distance_lte=(origin, D(km=radius)))
                    .annotate(distance=Distance("location", origin))
                    .order_by("distance")
                )
                return qs
            except ValueError:
                pass

        featured = Case(
            When(featured_until__gt=timezone.now(), then=Value(1)),
            default=Value(0),
            output_field=IntegerField(),
        )
        return qs.annotate(featured_rank=featured).order_by("-featured_rank", "-created_at")

    def get_serializer_context(self):
        context = super().get_serializer_context()
        user = self.request.user
        context["detail"] = self.action == "retrieve"
        context["saved_ids"] = (
            set(SavedListing.objects.filter(user=user).values_list("listing_id", flat=True))
            if user.is_authenticated
            else set()
        )
        return context

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    # ----- extra endpoints -----
    def _paginated(self, qs):
        page = self.paginate_queryset(qs)
        serializer = self.get_serializer(page, many=True)
        return self.get_paginated_response(serializer.data)

    @action(detail=False, methods=["get"])
    def mine(self, request):
        return self._paginated(self.get_queryset())

    @action(detail=False, methods=["get"])
    def saved(self, request):
        return self._paginated(self.get_queryset())

    @action(detail=True, methods=["post"], url_path="save")
    def save_toggle(self, request, pk=None):
        listing = self.get_object()
        obj, created = SavedListing.objects.get_or_create(user=request.user, listing=listing)
        if not created:
            obj.delete()
        return Response({"saved": created})

    @action(
        detail=True,
        methods=["post"],
        throttle_classes=[ScopedRateThrottle],
        throttle_scope="inquiry",
    )
    def inquire(self, request, pk=None):
        listing = self.get_object()
        serializer = InquirySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tenant = request.user if request.user.is_authenticated else None
        inquiry = Inquiry.objects.create(listing=listing, tenant=tenant, **serializer.validated_data)
        if listing.owner.phone:
            body = (
                f"Hama: {inquiry.name} ({inquiry.phone}) asked about \"{listing.title[:40]}\": "
                f"{inquiry.message[:80]}"
            )
            send_sms(listing.owner.phone, body)
        return Response({"detail": "Sent. The landlord will contact you."}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], parser_classes=[MultiPartParser, FormParser])
    def images(self, request, pk=None):
        listing = self.get_object()
        if listing.images.count() >= MAX_PHOTOS:
            return Response({"detail": f"A listing can have at most {MAX_PHOTOS} photos."}, status=400)
        serializer = ListingImageSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save(listing=listing)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class GeocodeView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "geocode"

    def get(self, request):
        return Response(geocoding.search(request.query_params.get("q", "")))
