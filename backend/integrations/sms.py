import logging

import africastalking
from django.conf import settings

from .phone import normalize_phone

log = logging.getLogger(__name__)
_ready = False


def _init():
    global _ready
    if not _ready:
        africastalking.initialize(settings.AT_USERNAME, settings.AT_API_KEY)
        _ready = True


def send_sms(to, message):
    """Send an SMS through Africa's Talking. Never raises: returns True/False."""
    if not settings.AT_API_KEY:
        log.info("SMS skipped (AT_API_KEY not set): %s", message)
        return False
    try:
        recipient = "+" + normalize_phone(to)
        _init()
        kwargs = {"sender_id": settings.AT_SENDER_ID} if settings.AT_SENDER_ID else {}
        africastalking.SMS.send(message, [recipient], **kwargs)
        return True
    except Exception:  # noqa: BLE001 - SMS must never break a request
        log.exception("Africa's Talking SMS failed")
        return False
