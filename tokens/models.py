import uuid

from django.db import models
from django.contrib.auth.models import User


class Token(models.Model):
    """
    A cafeteria meal voucher token.

    Tokens are purchased by users and redeemed at the cafeteria counter
    in exchange for meals or drinks.
    """

    STATUS_ACTIVE = "active"
    STATUS_REDEEMED = "redeemed"
    STATUS_EXPIRED = "expired"
    STATUS_CHOICES = [
        (STATUS_ACTIVE, "Active"),
        (STATUS_REDEEMED, "Redeemed"),
        (STATUS_EXPIRED, "Expired"),
    ]

    code = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    owner = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="cafeteria_tokens"
    )
    value = models.DecimalField(max_digits=8, decimal_places=2)
    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default=STATUS_ACTIVE
    )
    created_at = models.DateTimeField(auto_now_add=True)
    redeemed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Token {self.code} ({self.status})"
