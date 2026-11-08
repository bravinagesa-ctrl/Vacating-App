from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AreaViewSet, GeocodeView, ListingViewSet

router = DefaultRouter()
router.register("listings", ListingViewSet, basename="listing")
router.register("areas", AreaViewSet, basename="area")

urlpatterns = [
    path("geocode/", GeocodeView.as_view(), name="geocode"),
    path("", include(router.urls)),
]
