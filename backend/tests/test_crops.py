import pytest
from fastapi.testclient import TestClient


def test_create_crop_success(client, authenticated_user, test_farm, test_crop_data):
    """Test successful crop configuration creation."""
    farm_id = test_farm["id"]
    response = client.post(
        f"/api/v1/farms/{farm_id}/crop",
        json=test_crop_data,
        headers={"Authorization": f"Bearer {authenticated_user}"},
    )
    assert response.status_code == 201

    data = response.json()
    assert "id" in data
    assert data["crop_type"] == test_crop_data["crop_type"]
    assert data["crop_stage"] == test_crop_data["crop_stage"]
    assert data["root_depth_m"] == test_crop_data["root_depth_m"]
    assert data["kc_value_override"] == test_crop_data["kc_value_override"]
    assert data["is_active"] is True


def test_create_crop_without_auth(client, test_farm, test_crop_data):
    """Test creating crop without authentication."""
    farm_id = test_farm["id"]
    response = client.post(
        f"/api/v1/farms/{farm_id}/crop",
        json=test_crop_data,
    )
    assert response.status_code == 401


def test_create_crop_other_users_farm(client, authenticated_user, authenticated_user_2, test_farm, test_crop_data):
    """Test that user cannot create crop for another user's farm."""
    farm_id = test_farm["id"]
    response = client.post(
        f"/api/v1/farms/{farm_id}/crop",
        json=test_crop_data,
        headers={"Authorization": f"Bearer {authenticated_user_2}"},
    )
    assert response.status_code == 403


def test_get_crop_success(client, authenticated_user, test_farm, test_crop_data):
    """Test getting crop configuration."""
    # First create a crop
    farm_id = test_farm["id"]
    client.post(
        f"/api/v1/farms/{farm_id}/crop",
        json=test_crop_data,
        headers={"Authorization": f"Bearer {authenticated_user}"},
    )

    # Get the crop
    response = client.get(
        f"/api/v1/farms/{farm_id}/crop",
        headers={"Authorization": f"Bearer {authenticated_user}"},
    )
    assert response.status_code == 200

    data = response.json()
    assert data["crop_type"] == test_crop_data["crop_type"]
    assert data["is_active"] is True


def test_get_crop_not_found(client, authenticated_user, test_farm):
    """Test getting crop when none exists."""
    farm_id = test_farm["id"]
    response = client.get(
        f"/api/v1/farms/{farm_id}/crop",
        headers={"Authorization": f"Bearer {authenticated_user}"},
    )
    assert response.status_code == 404


def test_get_crop_without_auth(client, test_farm):
    """Test getting crop without authentication."""
    farm_id = test_farm["id"]
    response = client.get(f"/api/v1/farms/{farm_id}/crop")
    assert response.status_code == 401


def test_update_crop_success(client, authenticated_user, test_farm, test_crop_data):
    """Test updating crop configuration."""
    # First create a crop
    farm_id = test_farm["id"]
    client.post(
        f"/api/v1/farms/{farm_id}/crop",
        json=test_crop_data,
        headers={"Authorization": f"Bearer {authenticated_user}"},
    )

    # Update the crop
    update_data = {
        "crop_stage": "Harvest",
        "root_depth_m": 1.0,
    }
    response = client.patch(
        f"/api/v1/farms/{farm_id}/crop",
        json=update_data,
        headers={"Authorization": f"Bearer {authenticated_user}"},
    )
    assert response.status_code == 200

    data = response.json()
    assert data["crop_stage"] == "Harvest"
    assert data["root_depth_m"] == 1.0
    # Verify original values preserved
    assert data["crop_type"] == test_crop_data["crop_type"]


def test_update_crop_without_auth(client, test_farm, test_crop_data):
    """Test updating crop without authentication."""
    farm_id = test_farm["id"]
    response = client.patch(
        f"/api/v1/farms/{farm_id}/crop",
        json=test_crop_data,
    )
    assert response.status_code == 401


def test_update_crop_not_found(client, authenticated_user, test_farm):
    """Test updating crop when none exists."""
    farm_id = test_farm["id"]
    update_data = {"crop_stage": "Harvest"}
    response = client.patch(
        f"/api/v1/farms/{farm_id}/crop",
        json=update_data,
        headers={"Authorization": f"Bearer {authenticated_user}"},
    )
    assert response.status_code == 404


def test_new_crop_deactivates_old(client, authenticated_user, test_farm, test_crop_data):
    """Test that creating a new crop deactivates the previous one."""
    farm_id = test_farm["id"]

    # Create first crop
    client.post(
        f"/api/v1/farms/{farm_id}/crop",
        json=test_crop_data,
        headers={"Authorization": f"Bearer {authenticated_user}"},
    )

    # Create second crop
    second_crop_data = test_crop_data.copy()
    second_crop_data["crop_type"] = "Wheat"
    client.post(
        f"/api/v1/farms/{farm_id}/crop",
        json=second_crop_data,
        headers={"Authorization": f"Bearer {authenticated_user}"},
    )

    # Get current crop - should be the second one
    response = client.get(
        f"/api/v1/farms/{farm_id}/crop",
        headers={"Authorization": f"Bearer {authenticated_user}"},
    )
    assert response.status_code == 200
    assert response.json()["crop_type"] == "Wheat"
    assert response.json()["is_active"] is True


def test_crop_minimal_data(client, authenticated_user, test_farm):
    """Test creating crop with minimal required fields."""
    farm_id = test_farm["id"]
    minimal_crop = {
        "crop_type": "Olive",
        "crop_stage": "Seedling",
    }
    response = client.post(
        f"/api/v1/farms/{farm_id}/crop",
        json=minimal_crop,
        headers={"Authorization": f"Bearer {authenticated_user}"},
    )
    assert response.status_code == 201

    data = response.json()
    assert data["crop_type"] == "Olive"
    assert data["crop_stage"] == "Seedling"
    assert data["is_active"] is True
