from django.contrib import admin

from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "listing", "amount", "status", "mpesa_receipt", "created_at")
    list_filter = ("status",)
    readonly_fields = [f.name for f in Payment._meta.fields]
