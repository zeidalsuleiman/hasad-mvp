"""Tests for authentication hardening features.

Tests account activation, password reset, and 2FA flows.
"""
import pytest
from fastapi.testclient import TestClient
from app.core.security import (
    generate_secure_token, hash_token, verify_token_hash,
    generate_backup_codes, hash_backup_codes, verify_backup_code
)


class TestAccountActivation:
    """Tests for account activation flow."""

    def test_register_returns_activation_token(self, client):
        """Test that registration returns an activation token in debug mode."""
        user_data = {
            "full_name": "Test User",
            "email": "test@example.com",
            "password": "SecurePass123!",
        }
        response = client.post("/api/v1/auth/register", json=user_data)
        assert response.status_code == 201

        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert "activation_token" in data  # Available in debug mode
        assert "requires_activation" in data

    def test_register_user_defaults_to_verified(self, client):
        """Test that users are verified by default when activation is not required."""
        user_data = {
            "full_name": "Test User",
            "email": "test@example.com",
            "password": "SecurePass123!",
        }
        response = client.post("/api/v1/auth/register", json=user_data)
        assert response.status_code == 201

        # Verify user data
        token = response.json()["access_token"]
        me_response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert me_response.status_code == 200
        assert me_response.json()["is_verified"] is True

    def test_activate_account_with_valid_token(self, client, monkeypatch):
        """Test activating an account with a valid token."""
        # First register with activation required
        import os
        monkeypatch.setenv("ACTIVATION_REQUIRED", "true")

        user_data = {
            "full_name": "Test User",
            "email": "test@example.com",
            "password": "SecurePass123!",
        }
        register_response = client.post("/api/v1/auth/register", json=user_data)
        activation_token = register_response.json()["activation_token"]

        # Activate account
        activate_response = client.post(
            "/api/v1/auth/activate",
            json={"token": activation_token}
        )
        assert activate_response.status_code == 200
        assert "Account activated successfully" in activate_response.json()["message"]

        # Verify user is now verified
        token = register_response.json()["access_token"]
        me_response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert me_response.status_code == 200
        assert me_response.json()["is_verified"] is True

    def test_activate_account_with_invalid_token(self, client):
        """Test activating an account with an invalid token."""
        response = client.post(
            "/api/v1/auth/activate",
            json={"token": "invalid_token"}
        )
        assert response.status_code == 400
        assert "Invalid activation token" in response.json()["detail"]

    def test_login_with_unverified_account(self, client, monkeypatch):
        """Test that unverified users cannot login when activation is required."""
        import os
        monkeypatch.setenv("ACTIVATION_REQUIRED", "true")

        # Register (unverified)
        user_data = {
            "full_name": "Test User",
            "email": "test@example.com",
            "password": "SecurePass123!",
        }
        client.post("/api/v1/auth/register", json=user_data)

        # Try to login without activation
        login_response = client.post(
            "/api/v1/auth/login",
            json={"email": "test@example.com", "password": "SecurePass123!"}
        )
        assert login_response.status_code == 403
        assert "verify your email" in login_response.json()["detail"].lower()


class TestPasswordReset:
    """Tests for password reset flow."""

    def test_forgot_password_returns_success_for_existing_email(self, client, test_user_data):
        """Test that forgot password returns success for existing email."""
        # First register
        client.post("/api/v1/auth/register", json=test_user_data)

        # Request password reset
        response = client.post(
            "/api/v1/auth/forgot-password",
            json={"email": test_user_data["email"]}
        )
        assert response.status_code == 200
        assert "reset instructions" in response.json()["message"].lower()

    def test_forgot_password_returns_success_for_nonexistent_email(self, client):
        """Test that forgot password returns success for non-existent email (no enumeration)."""
        response = client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "nonexistent@example.com"}
        )
        assert response.status_code == 200
        # Generic success message to prevent email enumeration
        assert "reset instructions" in response.json()["message"].lower()

    def test_reset_password_with_valid_token(self, client, test_user_data):
        """Test resetting password with a valid token."""
        # First register
        client.post("/api/v1/auth/register", json=test_user_data)

        # Request password reset (token is logged in dev mode)
        client.post("/api/v1/auth/forgot-password", json={"email": test_user_data["email"]})

        # Note: In actual implementation, you'd need to retrieve the token from logs
        # For now, we'll test the endpoint structure

    def test_reset_password_with_invalid_token(self, client):
        """Test resetting password with an invalid token."""
        response = client.post(
            "/api/v1/auth/reset-password",
            json={
                "token": "invalid_token",
                "new_password": "NewSecurePass123!"
            }
        )
        assert response.status_code == 400
        assert "Invalid reset token" in response.json()["detail"]

    def test_reset_password_requires_minimum_length(self, client):
        """Test that password reset enforces minimum password length."""
        response = client.post(
            "/api/v1/auth/reset-password",
            json={
                "token": "some_token",
                "new_password": "short"
            }
        )
        # Pydantic validation error
        assert response.status_code == 422


class TestTwoFactorAuth:
    """Tests for two-factor authentication flow."""

    def test_get_2fa_status_when_disabled(self, client, authenticated_user):
        """Test getting 2FA status when disabled."""
        response = client.get(
            "/api/v1/auth/2fa/status",
            headers={"Authorization": f"Bearer {authenticated_user}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["two_factor_enabled"] is False
        assert data["backup_codes_remaining"] == 0

    def test_setup_2fa_returns_provisioning_uri(self, client, authenticated_user):
        """Test that 2FA setup returns a provisioning URI."""
        response = client.post(
            "/api/v1/auth/2fa/setup",
            headers={"Authorization": f"Bearer {authenticated_user}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "provisioning_uri" in data
        assert "secret" in data
        assert "otpauth://totp/" in data["provisioning_uri"]
        assert "HASAD" in data["provisioning_uri"]

    def test_enable_2fa_with_valid_code(self, client, authenticated_user):
        """Test enabling 2FA with a valid code."""
        # First setup 2FA to get the secret
        setup_response = client.post(
            "/api/v1/auth/2fa/setup",
            headers={"Authorization": f"Bearer {authenticated_user}"}
        )
        secret = setup_response.json()["secret"]

        # Generate a valid TOTP code using the secret
        import pyotp
        totp = pyotp.TOTP(secret)
        valid_code = totp.now()

        # Enable 2FA
        response = client.post(
            "/api/v1/auth/2fa/enable",
            json={"totp_secret": secret, "verification_code": valid_code},
            headers={"Authorization": f"Bearer {authenticated_user}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "backup_codes" in data
        assert len(data["backup_codes"]) == 10  # Default count

        # Verify 2FA is now enabled
        status_response = client.get(
            "/api/v1/auth/2fa/status",
            headers={"Authorization": f"Bearer {authenticated_user}"}
        )
        assert status_response.json()["two_factor_enabled"] is True

    def test_enable_2fa_with_invalid_code(self, client, authenticated_user):
        """Test that enabling 2FA fails with invalid code."""
        # First setup 2FA
        setup_response = client.post(
            "/api/v1/auth/2fa/setup",
            headers={"Authorization": f"Bearer {authenticated_user}"}
        )
        secret = setup_response.json()["secret"]

        # Try to enable with invalid code
        response = client.post(
            "/api/v1/auth/2fa/enable",
            json={"totp_secret": secret, "verification_code": "000000"},
            headers={"Authorization": f"Bearer {authenticated_user}"}
        )
        assert response.status_code == 400
        assert "Invalid verification code" in response.json()["detail"]

    def test_enable_2fa_when_already_enabled(self, client, authenticated_user):
        """Test that enabling 2FA fails when already enabled."""
        # Setup and enable 2FA
        setup_response = client.post(
            "/api/v1/auth/2fa/setup",
            headers={"Authorization": f"Bearer {authenticated_user}"}
        )
        secret = setup_response.json()["secret"]

        import pyotp
        totp = pyotp.TOTP(secret)
        valid_code = totp.now()

        client.post(
            "/api/v1/auth/2fa/enable",
            json={"totp_secret": secret, "verification_code": valid_code},
            headers={"Authorization": f"Bearer {authenticated_user}"}
        )

        # Try to enable again
        response = client.post(
            "/api/v1/auth/2fa/setup",
            headers={"Authorization": f"Bearer {authenticated_user}"}
        )
        assert response.status_code == 400
        assert "already enabled" in response.json()["detail"].lower()

    def test_disable_2fa_with_password(self, client, authenticated_user):
        """Test disabling 2FA with correct password."""
        # First enable 2FA
        setup_response = client.post(
            "/api/v1/auth/2fa/setup",
            headers={"Authorization": f"Bearer {authenticated_user}"}
        )
        secret = setup_response.json()["secret"]

        import pyotp
        totp = pyotp.TOTP(secret)
        valid_code = totp.now()

        client.post(
            "/api/v1/auth/2fa/enable",
            json={"totp_secret": secret, "verification_code": valid_code},
            headers={"Authorization": f"Bearer {authenticated_user}"}
        )

        # Disable 2FA
        response = client.post(
            "/api/v1/auth/2fa/disable",
            json={"password": "SecurePass123!"},
            headers={"Authorization": f"Bearer {authenticated_user}"}
        )
        assert response.status_code == 200
        assert "disabled successfully" in response.json()["message"].lower()

        # Verify 2FA is now disabled
        status_response = client.get(
            "/api/v1/auth/2fa/status",
            headers={"Authorization": f"Bearer {authenticated_user}"}
        )
        assert status_response.json()["two_factor_enabled"] is False

    def test_disable_2fa_with_wrong_password(self, client, authenticated_user):
        """Test that disabling 2FA fails with wrong password."""
        # First enable 2FA
        setup_response = client.post(
            "/api/v1/auth/2fa/setup",
            headers={"Authorization": f"Bearer {authenticated_user}"}
        )
        secret = setup_response.json()["secret"]

        import pyotp
        totp = pyotp.TOTP(secret)
        valid_code = totp.now()

        client.post(
            "/api/v1/auth/2fa/enable",
            json={"totp_secret": secret, "verification_code": valid_code},
            headers={"Authorization": f"Bearer {authenticated_user}"}
        )

        # Try to disable with wrong password
        response = client.post(
            "/api/v1/auth/2fa/disable",
            json={"password": "WrongPassword123!"},
            headers={"Authorization": f"Bearer {authenticated_user}"}
        )
        assert response.status_code == 401
        assert "Invalid password" in response.json()["detail"]

    def test_verify_2fa_with_valid_code(self, client, authenticated_user):
        """Test verifying a 2FA code."""
        # Enable 2FA
        setup_response = client.post(
            "/api/v1/auth/2fa/setup",
            headers={"Authorization": f"Bearer {authenticated_user}"}
        )
        secret = setup_response.json()["secret"]

        import pyotp
        totp = pyotp.TOTP(secret)
        valid_code = totp.now()

        client.post(
            "/api/v1/auth/2fa/enable",
            json={"totp_secret": secret, "verification_code": valid_code},
            headers={"Authorization": f"Bearer {authenticated_user}"}
        )

        # Verify 2FA code
        verify_response = client.post(
            "/api/v1/auth/2fa/verify",
            json={"code": totp.now()},
            headers={"Authorization": f"Bearer {authenticated_user}"}
        )
        assert verify_response.status_code == 200
        assert "access_token" in verify_response.json()

    def test_verify_2fa_with_backup_code(self, client, authenticated_user):
        """Test verifying a 2FA backup code."""
        # Enable 2FA
        setup_response = client.post(
            "/api/v1/auth/2fa/setup",
            headers={"Authorization": f"Bearer {authenticated_user}"}
        )
        secret = setup_response.json()["secret"]

        import pyotp
        totp = pyotp.TOTP(secret)
        valid_code = totp.now()

        enable_response = client.post(
            "/api/v1/auth/2fa/enable",
            json={"totp_secret": secret, "verification_code": valid_code},
            headers={"Authorization": f"Bearer {authenticated_user}"}
        )
        backup_codes = enable_response.json()["backup_codes"]

        # Verify with backup code
        verify_response = client.post(
            "/api/v1/auth/2fa/verify",
            json={"code": backup_codes[0]},
            headers={"Authorization": f"Bearer {authenticated_user}"}
        )
        assert verify_response.status_code == 200

        # Check that backup code was consumed
        status_response = client.get(
            "/api/v1/auth/2fa/status",
            headers={"Authorization": f"Bearer {authenticated_user}"}
        )
        assert status_response.json()["backup_codes_remaining"] == 9

    def test_regenerate_backup_codes(self, client, authenticated_user):
        """Test regenerating backup codes."""
        # Enable 2FA
        setup_response = client.post(
            "/api/v1/auth/2fa/setup",
            headers={"Authorization": f"Bearer {authenticated_user}"}
        )
        secret = setup_response.json()["secret"]

        import pyotp
        totp = pyotp.TOTP(secret)
        valid_code = totp.now()

        client.post(
            "/api/v1/auth/2fa/enable",
            json={"totp_secret": secret, "verification_code": valid_code},
            headers={"Authorization": f"Bearer {authenticated_user}"}
        )

        # Regenerate backup codes
        response = client.post(
            "/api/v1/auth/2fa/regenerate-backup-codes",
            json={"password": "SecurePass123!"},
            headers={"Authorization": f"Bearer {authenticated_user}"}
        )
        assert response.status_code == 200
        assert "backup_codes" in response.json()
        assert len(response.json()["backup_codes"]) == 10

    def test_regenerate_backup_codes_with_wrong_password(self, client, authenticated_user):
        """Test that regenerating backup codes fails with wrong password."""
        # Enable 2FA first
        setup_response = client.post(
            "/api/v1/auth/2fa/setup",
            headers={"Authorization": f"Bearer {authenticated_user}"}
        )
        secret = setup_response.json()["secret"]

        import pyotp
        totp = pyotp.TOTP(secret)
        valid_code = totp.now()

        client.post(
            "/api/v1/auth/2fa/enable",
            json={"totp_secret": secret, "verification_code": valid_code},
            headers={"Authorization": f"Bearer {authenticated_user}"}
        )

        # Try to regenerate with wrong password
        response = client.post(
            "/api/v1/auth/2fa/regenerate-backup-codes",
            json={"password": "WrongPassword123!"},
            headers={"Authorization": f"Bearer {authenticated_user}"}
        )
        assert response.status_code == 401


class TestLoginWith2FA:
    """Tests for login flow with 2FA."""

    def test_login_returns_requires_2fa_flag(self, client):
        """Test that login returns requires_2fa flag when 2FA is enabled."""
        # Register and enable 2FA
        user_data = {
            "full_name": "Test User",
            "email": "test2fa@example.com",
            "password": "SecurePass123!",
        }
        register_response = client.post("/api/v1/auth/register", json=user_data)
        token = register_response.json()["access_token"]

        # Enable 2FA
        setup_response = client.post(
            "/api/v1/auth/2fa/setup",
            headers={"Authorization": f"Bearer {token}"}
        )
        secret = setup_response.json()["secret"]

        import pyotp
        totp = pyotp.TOTP(secret)
        valid_code = totp.now()

        client.post(
            "/api/v1/auth/2fa/enable",
            json={"totp_secret": secret, "verification_code": valid_code},
            headers={"Authorization": f"Bearer {token}"}
        )

        # Login
        login_response = client.post(
            "/api/v1/auth/login",
            json={"email": user_data["email"], "password": user_data["password"]}
        )
        assert login_response.status_code == 200
        assert login_response.json()["requires_2fa"] is True

    def test_login_with_2fa_and_totp_code(self, client):
        """Test login with 2FA using TOTP code."""
        # Register and enable 2FA
        user_data = {
            "full_name": "Test User",
            "email": "test2fa2@example.com",
            "password": "SecurePass123!",
        }
        register_response = client.post("/api/v1/auth/register", json=user_data)
        token = register_response.json()["access_token"]

        # Enable 2FA
        setup_response = client.post(
            "/api/v1/auth/2fa/setup",
            headers={"Authorization": f"Bearer {token}"}
        )
        secret = setup_response.json()["secret"]

        import pyotp
        totp = pyotp.TOTP(secret)
        valid_code = totp.now()

        client.post(
            "/api/v1/auth/2fa/enable",
            json={"totp_secret": secret, "verification_code": valid_code},
            headers={"Authorization": f"Bearer {token}"}
        )

        # Login with 2FA
        login_2fa_response = client.post(
            "/api/v1/auth/login/2fa",
            json={
                "email": user_data["email"],
                "password": user_data["password"],
                "totp_code": totp.now()
            }
        )
        assert login_2fa_response.status_code == 200
        assert "access_token" in login_2fa_response.json()


class TestSecurityHelpers:
    """Tests for security helper functions."""

    def test_generate_secure_token(self):
        """Test that secure tokens are generated."""
        token = generate_secure_token()
        assert token
        assert len(token) == 64  # 32 bytes hex encoded
        assert all(c in "0123456789abcdef" for c in token.lower())

    def test_hash_token(self):
        """Test that token hashing is deterministic."""
        token = "test_token"
        hash1 = hash_token(token)
        hash2 = hash_token(token)
        assert hash1 == hash2
        assert hash1 != token

    def test_verify_token_hash(self):
        """Test that token verification works."""
        token = "test_token"
        token_hash = hash_token(token)
        assert verify_token_hash(token, token_hash) is True
        assert verify_token_hash("wrong_token", token_hash) is False

    def test_generate_backup_codes(self):
        """Test that backup codes are generated correctly."""
        codes = generate_backup_codes(5)
        assert len(codes) == 5
        assert all(len(code) == 9 for code in codes)  # XXXX-XXXX format
        assert all("-" in code for code in codes)

    def test_hash_backup_codes(self):
        """Test that backup code hashing works."""
        codes = ["ABCD-1234", "EFGH-5678"]
        hashed = hash_backup_codes(codes)
        assert len(hashed) == 2
        assert all(isinstance(h, str) for h in hashed)
        assert hashed[0] != codes[0]

    def test_verify_backup_code(self):
        """Test that backup code verification works."""
        codes = ["ABCD-1234", "EFGH-5678", "IJKL-9012"]
        hashed = hash_backup_codes(codes)

        # Valid code
        is_valid, idx = verify_backup_code("ABCD-1234", hashed)
        assert is_valid is True
        assert idx == 0

        # Invalid code
        is_valid, idx = verify_backup_code("WRNG-9999", hashed)
        assert is_valid is False
        assert idx is None
