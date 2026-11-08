from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from integrations.phone import normalize_phone

from .models import User


def _clean_phone(value):
    if not value:
        return value
    try:
        return normalize_phone(value)
    except ValueError as exc:
        raise serializers.ValidationError(str(exc))


class UserSerializer(serializers.ModelSerializer):
    can_post_listings = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "role", "phone", "can_post_listings"]
        read_only_fields = ["id", "username", "role", "can_post_listings"]

    def validate_phone(self, value):
        return _clean_phone(value)


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(choices=["tenant", "landlord", "agent"], default="tenant")

    class Meta:
        model = User
        fields = ["username", "email", "password", "first_name", "last_name", "role", "phone"]

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value.lower()

    def validate_phone(self, value):
        return _clean_phone(value)

    def validate(self, attrs):
        candidate = User(**{k: v for k, v in attrs.items() if k != "password"})
        validate_password(attrs["password"], candidate)
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user
