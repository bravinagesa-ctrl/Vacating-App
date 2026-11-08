import base64
from datetime import datetime

import requests
from django.conf import settings

TIMEOUT = 15


class MpesaError(Exception):
    pass


def _base_url():
    return "https://sandbox.safaricom.co.ke" if settings.MPESA_ENV == "sandbox" else "https://api.safaricom.co.ke"


def callback_url():
    return f"{settings.MPESA_CALLBACK_BASE_URL}/api/payments/mpesa/callback/{settings.MPESA_CALLBACK_TOKEN}/"


def _access_token():
    try:
        resp = requests.get(
            f"{_base_url()}/oauth/v1/generate",
            params={"grant_type": "client_credentials"},
            auth=(settings.MPESA_CONSUMER_KEY, settings.MPESA_CONSUMER_SECRET),
            timeout=TIMEOUT,
        )
        resp.raise_for_status()
        return resp.json()["access_token"]
    except (requests.RequestException, KeyError, ValueError) as exc:
        raise MpesaError("Could not authenticate with M-Pesa.") from exc


def stk_push(phone, amount, account_reference, description):
    """Start an STK push. `phone` must already be normalized (2547XXXXXXXX)."""
    if not (
        settings.MPESA_CONSUMER_KEY
        and settings.MPESA_PASSKEY
        and settings.MPESA_CALLBACK_BASE_URL
        and settings.MPESA_CALLBACK_TOKEN
    ):
        raise MpesaError("M-Pesa is not configured on the server.")

    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    password = base64.b64encode(f"{settings.MPESA_SHORTCODE}{settings.MPESA_PASSKEY}{timestamp}".encode()).decode()
    payload = {
        "BusinessShortCode": settings.MPESA_SHORTCODE,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": int(amount),
        "PartyA": phone,
        "PartyB": settings.MPESA_SHORTCODE,
        "PhoneNumber": phone,
        "CallBackURL": callback_url(),
        "AccountReference": account_reference[:12],
        "TransactionDesc": description[:13],
    }
    try:
        resp = requests.post(
            f"{_base_url()}/mpesa/stkpush/v1/processrequest",
            json=payload,
            headers={"Authorization": f"Bearer {_access_token()}"},
            timeout=TIMEOUT,
        )
        data = resp.json()
    except (requests.RequestException, ValueError) as exc:
        raise MpesaError("M-Pesa did not respond. Try again in a moment.") from exc

    if data.get("ResponseCode") != "0":
        raise MpesaError(data.get("errorMessage") or data.get("ResponseDescription") or "M-Pesa rejected the request.")
    return data
