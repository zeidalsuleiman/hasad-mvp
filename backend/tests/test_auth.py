import pytest
from fastapi.testclient import TestClient


def test_register_user_success(client, test_user_data):
    """Test successful user registration."""
    response = client.post("/api/v1/auth/register", json=test_user_data)
    assert response.status_code == 201

    data = response.json()
    assert "access_token" in data
    assert "token_type" in data
    assert data["token_type"] == "bearer"
    assert "user" in data
    assert data["user"]["email"] == test_user_data["email"]
    assert data["user"]["full_name"] == test_user_data["full_name"]
    assert data["user"]["role"] == "farmer"
    assert data["user"]["is_active"] is True
    assert "password_hash" not in data["user"]
    assert "password" not in data["user"]


def test_register_duplicate_email(client, test_user_data):
    """Test that duplicate email registration fails."""
    # First registration
    response = client.post("/api/v1/auth/register", json=test_user_data)
    assert response.status_code == 201

    # Second registration with same email
    response = client.post("/api/v1/auth/register", json=test_user_data)
    assert response.status_code == 400
    assert "Email already registered" in response.json()["detail"]


def test_register_missing_fields(client):
    """Test registration with missing required fields."""
    incomplete_data = {
        "full_name": "Test User",
        # email missing
        "password": "SecurePass123!",
    }
    response = client.post("/api/v1/auth/register", json=incomplete_data)
    assert response.status_code == 422


def test_login_success(client, test_user_data):
    """Test successful login."""
    # First register
    client.post("/api/v1/auth/register", json=test_user_data)

    # Then login
    login_data = {
        "email": test_user_data["email"],
        "password": test_user_data["password"],
    }
    response = client.post("/api/v1/auth/login", json=login_data)
    assert response.status_code == 200

    data = response.json()
    assert "access_token" in data
    assert "user" in data
    assert data["user"]["email"] == test_user_data["email"]


def test_login_invalid_email(client):
    """Test login with non-existent email."""
    login_data = {
        "email": "nonexistent@example.com",
        "password": "SecurePass123!",
    }
    response = client.post("/api/v1/auth/login", json=login_data)
    assert response.status_code == 401
    assert "Invalid" in response.json()["detail"]


def test_login_invalid_password(client, test_user_data):
    """Test login with wrong password."""
    # First register
    client.post("/api/v1/auth/register", json=test_user_data)

    # Try to login with wrong password
    login_data = {
        "email": test_user_data["email"],
        "password": "WrongPassword!",
    }
    response = client.post("/api/v1/auth/login", json=login_data)
    assert response.status_code == 401
    assert "Invalid" in response.json()["detail"]


def test_get_me_without_token(client):
    """Test accessing /me endpoint without authentication."""
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_get_me_with_valid_token(client, authenticated_user):
    """Test accessing /me endpoint with valid token."""
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {authenticated_user}"},
    )
    assert response.status_code == 200

    data = response.json()
    assert "email" in data
    assert "full_name" in data
    assert "role" in data
    assert "password" not in data
    assert "password_hash" not in data


def test_get_me_with_invalid_token(client):
    """Test accessing /me endpoint with invalid token."""
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid_token"},
    )
    assert response.status_code == 401
