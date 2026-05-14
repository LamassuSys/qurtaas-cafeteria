from rest_framework import serializers

from .models import Token


class TokenSerializer(serializers.ModelSerializer):
    owner = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Token
        fields = ["id", "code", "owner", "value", "status", "created_at", "redeemed_at"]
        read_only_fields = ["id", "code", "owner", "status", "created_at", "redeemed_at"]


class TokenCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Token
        fields = ["value"]
