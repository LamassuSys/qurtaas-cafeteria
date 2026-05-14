from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Token
from .serializers import TokenCreateSerializer, TokenSerializer


class TokenListCreateView(generics.ListCreateAPIView):
    """List the authenticated user's tokens or create a new one."""

    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return TokenCreateSerializer
        return TokenSerializer

    def get_queryset(self):
        return Token.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        token = Token.objects.get(pk=serializer.instance.pk)
        output = TokenSerializer(token)
        return Response(output.data, status=status.HTTP_201_CREATED)


class TokenDetailView(generics.RetrieveAPIView):
    """Retrieve a specific token by its UUID code."""

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = TokenSerializer
    lookup_field = "code"

    def get_queryset(self):
        return Token.objects.filter(owner=self.request.user)


class TokenRedeemView(APIView):
    """Redeem an active token."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, code):
        try:
            token = Token.objects.get(code=code, owner=request.user)
        except Token.DoesNotExist:
            return Response({"detail": "Token not found."}, status=status.HTTP_404_NOT_FOUND)

        if token.status != Token.STATUS_ACTIVE:
            return Response(
                {"detail": f"Token is already {token.status}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        token.status = Token.STATUS_REDEEMED
        token.redeemed_at = timezone.now()
        token.save()
        return Response(TokenSerializer(token).data)
