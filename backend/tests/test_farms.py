import pytest
from fastapi.testclient import TestClient


def test_create_farm_success(client, authenticated_user, test_farm_data):
    """Test successful farm creation."""
    response = client.post(
        "/api/v1/farms",
        json=test_farm_data,
        headers={"Authorization": f"Bearer {authenticated_user}"},
    )
    assert response.status_code == 201

    data = response.json()
    assert "id" in data
    assert data["name"] == test_farm_data["name"]
    assert data["latitude"] == test_farm_data["latitude"]
    assert data["longitude"] == test_farm_data["longitude"]
    assert data["area_dunum"] == test_farm_data["area_dunum"]
    assert data["soil_type"] == test_farm_data["soil_type"]
    assert data["irrigation_method"] == test_farm_data["irrigation_method"]
    assert data["notes"] == test_farm_data["notes"]


def test_create_farm_without_auth(client, test_farm_data):
    """Test farm creation without authentication."""
    response = client.post("/api/v1/farms", json=test_farm_data)
    assert response.status_code == 401


def test_create_farm_invalid_coordinates(client, authenticated_user):
    """Test farm creation with invalid coordinates."""
    invalid_farm = {
        "name": "Invalid Farm",
        "latitude": 100.0,  # Invalid: must be -90 to 90
        "longitude": 35.8728,
        "soil_type": "Loam",
    }
    response = client.post(
        "/api/v1/farms",
        json=invalid_farm,
        headers={"Authorization": f"Bearer {authenticated_user}"},
    )
    assert response.status_code == 422


def test_create_farm_missing_required_fields(client, authenticated_user):
    """Test farm creation with missing required fields."""
    incomplete_farm = {
        "name": "Incomplete Farm",
        # latitude missing
        "longitude": 35.8728,
        "soil_type": "Loam",
    }
    response = client.post(
        "/api/v1/farms",
        json=incomplete_farm,
        headers={"Authorization": f"Bearer {authenticated_user}"},
    )
    assert response.status_code == 422


def test_list_farms_empty(client, authenticated_user):
    """Test listing farms when user has no farms."""
    response = client.get(
        "/api/v1/farms",
        headers={"Authorization": f"Bearer {authenticated_user}"},
    )
    assert response.status_code == 200
    assert response.json() == []


def test_list_farms_with_farms(client, authenticated_user, test_farm_data):
    """Test listing farms when user has farms."""
    # Create two farms
    farm1 = test_farm_data.copy()
    farm1["name"] = "Farm 1"
    client.post(
        "/api/v1/farms",
        json=farm1,
        headers={"Authorization": f"Bearer {authenticated_user}"},
    )

    farm2 = test_farm_data.copy()
    farm2["name"] = "Farm 2"
    farm2["latitude"] = 32.5000
    client.post(
        "/api/v1/farms",
        json=farm2,
        headers={"Authorization": f"Bearer {authenticated_user}"},
    )

    # List farms
    response = client.get(
        "/api/v1/farms",
        headers={"Authorization": f"Bearer {authenticated_user}"},
    )
    assert response.status_code == 200

    farms = response.json()
    assert len(farms) == 2
    farm_names = [f["name"] for f in farms]
    assert "Farm 1" in farm_names
    assert "Farm 2" in farm_names


def test_list_farms_without_auth(client):
    """Test listing farms without authentication."""
    response = client.get("/api/v1/farms")
    assert response.status_code == 401


def test_list_farms_other_users_farm(client, authenticated_user, authenticated_user_2, test_farm_data):
    """Test that user cannot see another user's farms."""
    # Create farm for user 1
    client.post(
        "/api/v1/farms",
        json=test_farm_data,
        headers={"Authorization": f"Bearer {authenticated_user}"},
    )

    # List farms for user 2 - should be empty
    response = client.get(
        "/api/v1/farms",
        headers={"Authorization": f"Bearer {authenticated_user_2}"},
    )
    assert response.status_code == 200
    assert len(response.json()) == 0


def test_get_farm_success(client, authenticated_user, test_farm):
    """Test getting a specific farm."""
    farm_id = test_farm["id"]
    response = client.get(
        f"/api/v1/farms/{farm_id}",
        headers={"Authorization": f"Bearer {authenticated_user}"},
    )
    assert response.status_code == 200

    data = response.json()
    assert data["id"] == farm_id
    assert data["name"] == test_farm["name"]


def test_get_farm_without_auth(client, test_farm):
    """Test getting a farm without authentication."""
    farm_id = test_farm["id"]
    response = client.get(f"/api/v1/farms/{farm_id}")
    assert response.status_code == 401


def test_get_farm_not_found(client, authenticated_user):
    """Test getting a non-existent farm."""
    fake_id = "00000000-0000-0000-0000-000000000000"
    response = client.get(
        f"/api/v1/farms/{fake_id}",
        headers={"Authorization": f"Bearer {authenticated_user}"},
    )
    assert response.status_code == 404


def test_get_farm_other_users_farm(client, authenticated_user, authenticated_user_2, test_farm):
    """Test that user cannot get another user's farm."""
    farm_id = test_farm["id"]
    response = client.get(
        f"/api/v1/farms/{farm_id}",
        headers={"Authorization": f"Bearer {authenticated_user_2}"},
    )
    assert response.status_code == 403


def test_update_farm_success(client, authenticated_user, test_farm):
    """Test updating a farm."""
    farm_id = test_farm["id"]
    update_data = {
        "name": "Updated Farm Name",
        "area_dunum": 10.0,
        "soil_type": "Clay",
    }
    response = client.patch(
        f"/api/v1/farms/{farm_id}",
        json=update_data,
        headers={"Authorization": f"Bearer {authenticated_user}"},
    )
    assert response.status_code == 200

    data = response.json()
    assert data["name"] == "Updated Farm Name"
    assert data["area_dunum"] == 10.0
    assert data["soil_type"] == "Clay"
    # Verify original values are preserved
    assert data["latitude"] == test_farm["latitude"]
    assert data["longitude"] == test_farm["longitude"]


def test_update_farm_without_auth(client, test_farm):
    """Test updating a farm without authentication."""
    farm_id = test_farm["id"]
    update_data = {"name": "Hacked Farm"}
    response = client.patch(f"/api/v1/farms/{farm_id}", json=update_data)
    assert response.status_code == 401


def test_update_farm_other_users_farm(client, authenticated_user, authenticated_user_2, test_farm):
    """Test that user cannot update another user's farm."""
    farm_id = test_farm["id"]
    update_data = {"name": "Hacked Farm"}
    response = client.patch(
        f"/api/v1/farms/{farm_id}",
        json=update_data,
        headers={"Authorization": f"Bearer {authenticated_user_2}"},
    )
    assert response.status_code == 403


def test_delete_farm_success(client, authenticated_user, test_farm):
    """Test deleting a farm."""
    farm_id = test_farm["id"]

    # Delete the farm
    response = client.delete(
        f"/api/v1/farms/{farm_id}",
        headers={"Authorization": f"Bearer {authenticated_user}"},
    )
    assert response.status_code == 204

    # Verify farm is deleted
    response = client.get(
        f"/api/v1/farms/{farm_id}",
        headers={"Authorization": f"Bearer {authenticated_user}"},
    )
    assert response.status_code == 404


def test_delete_farm_without_auth(client, test_farm):
    """Test deleting a farm without authentication."""
    farm_id = test_farm["id"]
    response = client.delete(f"/api/v1/farms/{farm_id}")
    assert response.status_code == 401


def test_delete_farm_other_users_farm(client, authenticated_user, authenticated_user_2, test_farm):
    """Test that user cannot delete another user's farm."""
    farm_id = test_farm["id"]
    response = client.delete(
        f"/api/v1/farms/{farm_id}",
        headers={"Authorization": f"Bearer {authenticated_user_2}"},
    )
    assert response.status_code == 403

    # Verify farm still exists
    response = client.get(
        f"/api/v1/farms/{farm_id}",
        headers={"Authorization": f"Bearer {authenticated_user}"},
    )
    assert response.status_code == 200
