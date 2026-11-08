from django.conf import settings
from django.contrib.gis.db import models as gis_models
from django.db import models
from django.utils import timezone

AMENITIES = [
    "water",
    "backup_water",
    "parking",
    "security",
    "gated",
    "cctv",
    "wifi",
    "balcony",
    "dsq",
    "tiled",
]


class Area(models.Model):
    """A neighbourhood such as Uthiru, Kilimani or Ruaka, with local living info."""

    name = models.CharField(max_length=120)
    slug = models.SlugField(unique=True)
    county = models.CharField(max_length=80, default="Nairobi")
    center = gis_models.PointField(srid=4326)
    description = models.TextField(blank=True)
    # 1 (poor) to 5 (excellent). Fill these from your own local knowledge or surveys.
    water_score = models.PositiveSmallIntegerField(default=3)
    security_score = models.PositiveSmallIntegerField(default=3)
    transport_score = models.PositiveSmallIntegerField(default=3)
    internet_score = models.PositiveSmallIntegerField(default=3)
    nearest_stage = models.CharField(max_length=160, blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name}, {self.county}"


class Listing(models.Model):
    class HouseType(models.TextChoices):
        SINGLE_ROOM = "single_room", "Single room"
        BEDSITTER = "bedsitter", "Bedsitter"
        STUDIO = "studio", "Studio"
        APARTMENT = "apartment", "Apartment"
        MAISONETTE = "maisonette", "Maisonette"
        BUNGALOW = "bungalow", "Bungalow"
        TOWNHOUSE = "townhouse", "Townhouse"

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="listings")
    title = models.CharField(max_length=160)
    description = models.TextField(blank=True)
    house_type = models.CharField(max_length=20, choices=HouseType.choices, default=HouseType.APARTMENT)
    price_kes = models.PositiveIntegerField(help_text="Monthly rent in KES")
    bedrooms = models.PositiveSmallIntegerField(default=1)
    bathrooms = models.PositiveSmallIntegerField(default=1)
    area = models.ForeignKey(Area, null=True, blank=True, on_delete=models.SET_NULL, related_name="listings")
    address_text = models.CharField(max_length=255, blank=True, help_text="Estate, road or landmark")
    location = gis_models.PointField(srid=4326)
    amenities = models.JSONField(default=list, blank=True)
    is_available = models.BooleanField(default=True)
    is_verified = models.BooleanField(default=False)
    featured_until = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["price_kes"]), models.Index(fields=["is_available", "-created_at"])]

    @property
    def is_featured(self):
        return bool(self.featured_until and self.featured_until > timezone.now())

    def __str__(self):
        return self.title


class ListingImage(models.Model):
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="listings/%Y/%m/")
    caption = models.CharField(max_length=160, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["id"]


class SavedListing(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="saved_listings")
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name="saved_by")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [("user", "listing")]


class Inquiry(models.Model):
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name="inquiries")
    tenant = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    name = models.CharField(max_length=120)
    phone = models.CharField(max_length=20)
    message = models.TextField(max_length=1000)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "inquiries"
