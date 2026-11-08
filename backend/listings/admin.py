from django.contrib import admin
from django.contrib.gis.admin import GISModelAdmin

from .models import Area, Inquiry, Listing, ListingImage, SavedListing


class ListingImageInline(admin.TabularInline):
    model = ListingImage
    extra = 0


@admin.register(Area)
class AreaAdmin(GISModelAdmin):
    list_display = ("name", "county", "water_score", "security_score", "transport_score", "internet_score")
    search_fields = ("name", "county")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Listing)
class ListingAdmin(GISModelAdmin):
    list_display = ("title", "owner", "area", "price_kes", "is_available", "is_verified", "featured_until", "created_at")
    list_filter = ("is_verified", "is_available", "house_type", "area")
    search_fields = ("title", "address_text", "owner__username")
    inlines = [ListingImageInline]
    actions = ["mark_verified", "mark_unverified"]

    @admin.action(description="Mark selected listings as verified")
    def mark_verified(self, request, queryset):
        queryset.update(is_verified=True)

    @admin.action(description="Remove verified badge")
    def mark_unverified(self, request, queryset):
        queryset.update(is_verified=False)


@admin.register(Inquiry)
class InquiryAdmin(admin.ModelAdmin):
    list_display = ("listing", "name", "phone", "created_at")


admin.site.register(SavedListing)
