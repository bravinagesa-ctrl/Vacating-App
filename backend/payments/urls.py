from django.urls import path

from .views import MpesaCallbackView, PaymentDetailView, StkPushView

urlpatterns = [
    path("mpesa/stk/", StkPushView.as_view(), name="mpesa-stk"),
    path("mpesa/callback/<str:token>/", MpesaCallbackView.as_view(), name="mpesa-callback"),
    path("<int:pk>/", PaymentDetailView.as_view(), name="payment-detail"),
]
