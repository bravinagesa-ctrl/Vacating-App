from django.contrib.gis.geos import Point
from rest_framework import serializers

from integrations.phone import normalize_phone

from .models import AMENITIES, Area, Inquiry, Listing, ListingImage

MAX_IMAGE_BYTES = 5 * 1024 * 1024


class AreaSerializer(serializers.ModelSerializer):
    lat = serializers.SerializerMethodField()
    lng = serializers.SerializerMethodField()
    listing_count = serializers.SerializerMethodField()

    class Meta:
        model = Area
        fields = [
            "id", "name", "slug", "county", "lat", "lng", "description",
            "water_score", "security_score", "transport_score", "internet_score",
            "nearest_stage", "listing_count",
        ]

    def get_lat(self, obj):
        return obj.center.y

    def get_lng(self, obj):
        return obj.center.x

    def get_listing_count(self, obj):
        return getattr(obj, "listing_count", None)


class ListingImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListingImage
        fields = ["id", "image", "caption"]

    def validate_image(self, value):
        if value.size > MAX_IMAGE_BYTES:
            raise serializers.ValidationError("Each photo must be 5 MB or smaller.")
        return value


class ListingSerializer(serializers.ModelSerializer):
    lat = serializers.SerializerMethodField()
    lng = serializers.SerializerMethodField()
    latitude = serializers.FloatField(write_only=True, required=False)
    longitude = serializers.FloatField(write_only=True, required=False)
    area = AreaSerializer(read_only=True)
    area_id = serializers.PrimaryKeyRelatedField(
        source="area", queryset=Area.objects.all(), write_only=True, required=False, allow_null=True
    )
    images = ListingImageSerializer(many=True, read_only=True)
    is_featured = serializers.BooleanField(read_only=True)
    distance_km = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()
    owner_name = serializers.SerializerMethodField()
    contact_phone = serializers.SerializerMethodField()

    class Meta:
        model = Listing
        fields = [
            "id", "title", "description", "house_type", "price_kes", "bedrooms", "bathrooms",
            "area", "area_id", "address_text", "amenities", "is_available", "is_verified",
            "is_featured", "featured_until", "lat", "lng", "latitude", "longitude", "images",
            "distance_km", "is_saved", "owner_name", "contact_phone", "created_at",
        ]
        read_only_fields = ["is_verified", "featured_until", "created_at"]

    # ----- read helpers -----
    def get_lat(self, obj):
        return obj.location.y

    def get_lng(self, obj):
        return obj.location.x

    def get_distance_km(self, obj):
        distance = getattr(obj, "distance", None)
        return round(distance.km, 2) if distance is not None else None

    def get_is_saved(self, obj):
        return obj.id in self.context.get("saved_ids", set())

    def get_owner_name(self, obj):
        return obj.owner.first_name or obj.owner.username

    def get_contact_phone(self, obj):
        # Only exposed on the detail endpoint, to make scraping every number harder.
        if not self.context.get("detail"):
            return None
        phone = obj.owner.phone
        if not phone:
            return None
        try:
            return normalize_phone(phone)
        except ValueError:
            return phone

    # ----- write helpers -----
    def validate_amenities(self, value):
        if not isinstance(value, list) or any(item not in AMENITIES for item in value):
            raise serializers.ValidationError("Choose amenities from the list provided.")
        return sorted(set(value))

    def validate(self, attrs):
        lat, lng = attrs.get("latitude"), attrs.get("longitude")
        if self.instance is None and (lat is None or lng is None):
            raise serializers.ValidationError({"latitude": "Drop a pin on the map to set the location."})
        if (lat is None) != (lng is None):
            raise serializers.ValidationError({"latitude": "Send both latitude and longitude."})
        if lat is not None and not (-5.0 <= lat <= 5.5 and 33.5 <= lng <= 42.0):
            raise serializers.ValidationError({"latitude": "The pin must be inside Kenya."})
        return attrs

    def create(self, validated_data):
        lat = validated_data.pop("latitude")
        lng = validated_data.pop("longitude")
        validated_data["location"] = Point(lng, lat, srid=4326)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        lat = validated_data.pop("latitude", None)
        lng = validated_data.pop("longitude", None)
        if lat is not None and lng is not None:
            validated_data["location"] = Point(lng, lat, srid=4326)
        return super().update(instance, validated_data)


class InquirySerializer(serializers.ModelSerializer):
    class Meta:
        model = Inquiry
        fields = ["name", "phone", "message"]

    def validate_phone(self, value):
        try:
            return normalize_phone(value)
        except ValueError as exc:
            raise serializers.ValidationError(str(exc))
