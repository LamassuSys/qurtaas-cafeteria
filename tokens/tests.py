from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Token


class TokenModelTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password="pass")

    def test_token_created_with_active_status(self):
        token = Token.objects.create(owner=self.user, value="5.00")
        self.assertEqual(token.status, Token.STATUS_ACTIVE)
        self.assertIsNotNone(token.code)

    def test_token_str(self):
        token = Token.objects.create(owner=self.user, value="5.00")
        self.assertIn("active", str(token))


class TokenAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="bob", password="pass")
        self.other = User.objects.create_user(username="carol", password="pass")
        self.client.force_authenticate(user=self.user)

    def _list_url(self):
        return reverse("token-list-create")

    def _detail_url(self, code):
        return reverse("token-detail", kwargs={"code": str(code)})

    def _redeem_url(self, code):
        return reverse("token-redeem", kwargs={"code": str(code)})

    # --- create ---

    def test_create_token(self):
        resp = self.client.post(self._list_url(), {"value": "10.00"})
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["status"], Token.STATUS_ACTIVE)
        self.assertEqual(resp.data["owner"], "bob")

    def test_create_token_requires_auth(self):
        self.client.force_authenticate(user=None)
        resp = self.client.post(self._list_url(), {"value": "10.00"})
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_token_invalid_value(self):
        resp = self.client.post(self._list_url(), {"value": "not-a-number"})
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    # --- list ---

    def test_list_own_tokens_only(self):
        Token.objects.create(owner=self.user, value="5.00")
        Token.objects.create(owner=self.other, value="5.00")
        resp = self.client.get(self._list_url())
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 1)

    # --- detail ---

    def test_retrieve_token(self):
        token = Token.objects.create(owner=self.user, value="7.50")
        resp = self.client.get(self._detail_url(token.code))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(str(resp.data["code"]), str(token.code))

    def test_cannot_retrieve_other_users_token(self):
        token = Token.objects.create(owner=self.other, value="7.50")
        resp = self.client.get(self._detail_url(token.code))
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    # --- redeem ---

    def test_redeem_token(self):
        token = Token.objects.create(owner=self.user, value="5.00")
        resp = self.client.post(self._redeem_url(token.code))
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["status"], Token.STATUS_REDEEMED)
        self.assertIsNotNone(resp.data["redeemed_at"])

    def test_redeem_already_redeemed_token(self):
        token = Token.objects.create(
            owner=self.user, value="5.00", status=Token.STATUS_REDEEMED
        )
        resp = self.client.post(self._redeem_url(token.code))
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_redeem_other_users_token(self):
        token = Token.objects.create(owner=self.other, value="5.00")
        resp = self.client.post(self._redeem_url(token.code))
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)
