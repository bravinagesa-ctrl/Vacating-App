from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        TENANT = "tenant", "Tenant"
        LANDLORD = "landlord", "Landlord"
        AGENT = "agent", "Agent"
        ADMIN = "admin", "Admin"

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.TENANT)
    phone = models.CharField(max_length=20, blank=True)

    REQUIRED_FIELDS = ["email"]

    @property
    def can_post_listings(self):
        return self.role in (self.Role.LANDLORD, self.Role.AGENT, self.Role.ADMIN)

    def __str__(self):
        return self.username
