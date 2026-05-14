from django.urls import path

from .views import TokenDetailView, TokenListCreateView, TokenRedeemView

urlpatterns = [
    path("", TokenListCreateView.as_view(), name="token-list-create"),
    path("<uuid:code>/", TokenDetailView.as_view(), name="token-detail"),
    path("<uuid:code>/redeem/", TokenRedeemView.as_view(), name="token-redeem"),
]
