import django_filters

from .models import Listing


class ListingFilter(django_filters.FilterSet):
    min_price = django_filters.NumberFilter(field_name="price_kes", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="price_kes", lookup_expr="lte")
    min_bedrooms = django_filters.NumberFilter(field_name="bedrooms", lookup_expr="gte")
    area = django_filters.CharFilter(field_name="area__slug")
    verified = django_filters.BooleanFilter(field_name="is_verified")
    amenities = django_filters.CharFilter(method="filter_amenities")

    class Meta:
        model = Listing
        fields = ["house_type"]

    def filter_amenities(self, queryset, name, value):
        wanted = [item.strip() for item in value.split(",") if item.strip()]
        return queryset.filter(amenities__contains=wanted) if wanted else queryset
