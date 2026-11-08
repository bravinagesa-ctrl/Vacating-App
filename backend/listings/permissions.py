from rest_framework.permissions import SAFE_METHODS, BasePermission


class CanPostListings(BasePermission):
    message = "Only landlord and agent accounts can post listings."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.can_post_listings)


class IsOwnerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        user = request.user
        return bool(user.is_authenticated and (obj.owner_id == user.id or user.role == "admin" or user.is_staff))
