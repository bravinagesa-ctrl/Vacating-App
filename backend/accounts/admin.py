from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class HamaUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (("Hama", {"fields": ("role", "phone")}),)
    list_display = ("username", "email", "role", "phone", "is_staff")
    list_filter = UserAdmin.list_filter + ("role",)
