from django.contrib import admin

from .models import Token


@admin.register(Token)
class TokenAdmin(admin.ModelAdmin):
    list_display = ["code", "owner", "value", "status", "created_at", "redeemed_at"]
    list_filter = ["status"]
    search_fields = ["code", "owner__username"]
    readonly_fields = ["code", "created_at", "redeemed_at"]
