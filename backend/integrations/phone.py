import re


def normalize_phone(raw):
    """Return a Kenyan number as 2547XXXXXXXX / 2541XXXXXXXX (no plus sign). Raises ValueError."""
    digits = re.sub(r"\D", "", raw or "")
    if digits.startswith("254") and len(digits) == 12:
        pass
    elif digits.startswith("0") and len(digits) == 10:
        digits = "254" + digits[1:]
    elif len(digits) == 9 and digits[0] in "71":
        digits = "254" + digits
    else:
        raise ValueError("Enter a valid Kenyan phone number, for example 0712345678.")
    if digits[3] not in "71":
        raise ValueError("Enter a valid Kenyan phone number, for example 0712345678.")
    return digits
