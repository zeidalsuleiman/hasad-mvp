import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from datetime import datetime


@pytest.fixture
def mock_irrigation_weather_response():
    """Mock weather response for irrigation calculation."""
    return {
        "main": {
            "temp": 30.0,
            "humidity": 60,
            "pressure": 1015,
        },
        "wind": {
            "speed": 3.0,
        },
        "weather": [
            {
                "description": "clear sky",
            }
        ],
        "clouds": {
            "all": 10,
        },
    }


def test_calculate_irrigation_success(client, authenticated_user, test_farm, mock_irrigation_weather_response):
    """Test irrigation calculation with active crop and weather data."""
    # First create a crop for the farm
    crop_data = {
        "crop_type": "Tomato",
        "crop_stage": "Mid-season",
        "planting_date": "2026-03-01T00:00:00",
        "root_depth_m": 0.5,
        "kc_value_override": None,
    }
    client.post(
        f"/api/v1/farms/{test_farm['id']}/crop",
        json=crop_data,
        headers={"Authorization": f"Bearer {authenticated_user}"},
    )

    # Mock weather API response
    with patch("app.services.weather_service.requests.get") as mock_get:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_irrigation_weather_response
        mock_response.raise_for_status = MagicMock()
        mock_get.return_value = mock_response

        # Calculate irrigation
        response = client.post(
            f"/api/v1/farms/{test_farm['id']}/irrigation/calculate",
            headers={"Authorization": f"Bearer {authenticated_user}"},
        )

        assert response.status_code == 200

        data = response.json()
        assert "id" in data
        assert "et0" in data
        assert "kc" in data
        assert "etc" in data
        assert "net_irrigation_mm" in data
        assert "recommendation_text" in data
        assert "assumptions" in data
        assert isinstance(data["assumptions"], list)
        assert len(data["assumptions"]) > 0

        # Verify KC value for Tomato Mid-season
        assert data["kc"] == pytest.approx(1.15, abs=0.01)


def test_calculate_irrigation_without_auth(client, test_farm):
    """Test irrigation calculation without authentication."""
    response = client.post(
        f"/api/v1/farms/{test_farm['id']}/irrigation/calculate",
    )
    assert response.status_code == 401


def test_calculate_irrigation_other_users_farm(client, authenticated_user, authenticated_user_2, test_farm):
    """Test that user cannot calculate irrigation for another user's farm."""
    response = client.post(
        f"/api/v1/farms/{test_farm['id']}/irrigation/calculate",
        headers={"Authorization": f"Bearer {authenticated_user_2}"},
    )
    assert response.status_code == 403


def test_calculate_irrigation_without_crop(client, authenticated_user, test_farm, mock_irrigation_weather_response):
    """Test irrigation calculation without active crop (uses default Kc)."""
    with patch("app.services.weather_service.requests.get") as mock_get:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_irrigation_weather_response
        mock_response.raise_for_status = MagicMock()
        mock_get.return_value = mock_response

        response = client.post(
            f"/api/v1/farms/{test_farm['id']}/irrigation/calculate",
            headers={"Authorization": f"Bearer {authenticated_user}"},
        )

        assert response.status_code == 200

        data = response.json()
        # Should use default KC value
        assert data["kc"] == pytest.approx(0.70, abs=0.01)


def test_irrigation_with_kc_override(client, authenticated_user, test_farm, mock_irrigation_weather_response):
    """Test irrigation calculation with user-provided Kc override."""
    # Create crop with KC override
    crop_data = {
        "crop_type": "Wheat",
        "crop_stage": "Mid-season",
        "kc_value_override": 1.5,
    }
    client.post(
        f"/api/v1/farms/{test_farm['id']}/crop",
        json=crop_data,
        headers={"Authorization": f"Bearer {authenticated_user}"},
    )

    with patch("app.services.weather_service.requests.get") as mock_get:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_irrigation_weather_response
        mock_response.raise_for_status = MagicMock()
        mock_get.return_value = mock_response

        response = client.post(
            f"/api/v1/farms/{test_farm['id']}/irrigation/calculate",
            headers={"Authorization": f"Bearer {authenticated_user}"},
        )

        assert response.status_code == 200

        data = response.json()
        # Should use the override value
        assert data["kc"] == pytest.approx(1.5, abs=0.01)


def test_irrigation_different_soil_types(client, authenticated_user, test_farm, mock_irrigation_weather_response):
    """Test irrigation calculation with different soil types."""
    # Update farm to have sandy soil (low retention)
    update_data = {"soil_type": "Sandy"}
    client.patch(
        f"/api/v1/farms/{test_farm['id']}",
        json=update_data,
        headers={"Authorization": f"Bearer {authenticated_user}"},
    )

    with patch("app.services.weather_service.requests.get") as mock_get:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_irrigation_weather_response
        mock_response.raise_for_status = MagicMock()
        mock_get.return_value = mock_response

        response = client.post(
            f"/api/v1/farms/{test_farm['id']}/irrigation/calculate",
            headers={"Authorization": f"Bearer {authenticated_user}"},
        )

        assert response.status_code == 200

        data = response.json()
        assert "effective_rainfall_mm" in data


def test_irrigation_with_high_rainfall(client, authenticated_user, test_farm):
    """Test irrigation calculation when rainfall exceeds ETc (no irrigation needed)."""
    # Mock weather with heavy rainfall
    mock_weather = {
        "main": {
            "temp": 25.0,
            "humidity": 80,
            "pressure": 1015,
        },
        "wind": {"speed": 2.0},
        "weather": [{"description": "rain"}],
        "clouds": {"all": 90},
        "rain": {"1h": 15.0},  # Heavy rain
    }

    with patch("app.services.weather_service.requests.get") as mock_get:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_weather
        mock_response.raise_for_status = MagicMock()
        mock_get.return_value = mock_response

        response = client.post(
            f"/api/v1/farms/{test_farm['id']}/irrigation/calculate",
            headers={"Authorization": f"Bearer {authenticated_user}"},
        )

        assert response.status_code == 200

        data = response.json()
        # With heavy rain, net irrigation should be low or zero
        assert "net_irrigation_mm" in data
        assert data["recommendation_text"].lower()


def test_irrigation_history_empty(client, authenticated_user, test_farm):
    """Test getting irrigation history when no calculations exist."""
    response = client.get(
        f"/api/v1/farms/{test_farm['id']}/irrigation/history",
        headers={"Authorization": f"Bearer {authenticated_user}"},
    )
    assert response.status_code == 200
    assert response.json() == []


def test_irrigation_history_with_data(client, authenticated_user, test_farm, mock_irrigation_weather_response):
    """Test getting irrigation history with calculations."""
    # Create a calculation first
    with patch("app.services.weather_service.requests.get") as mock_get:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_irrigation_weather_response
        mock_response.raise_for_status = MagicMock()
        mock_get.return_value = mock_response

        client.post(
            f"/api/v1/farms/{test_farm['id']}/irrigation/calculate",
            headers={"Authorization": f"Bearer {authenticated_user}"},
        )

    # Get history
    response = client.get(
        f"/api/v1/farms/{test_farm['id']}/irrigation/history",
        headers={"Authorization": f"Bearer {authenticated_user}"},
    )

    assert response.status_code == 200

    data = response.json()
    assert len(data) > 0

    # Verify response structure
    entry = data[0]
    assert "id" in entry
    assert "et0" in entry
    assert "kc" in entry
    assert "recommendation_text" in entry
    assert "assumptions" in entry


def test_irrigation_history_without_auth(client, test_farm):
    """Test getting irrigation history without authentication."""
    response = client.get(
        f"/api/v1/farms/{test_farm['id']}/irrigation/history",
    )
    assert response.status_code == 401


def test_irrigation_history_other_users_farm(client, authenticated_user, authenticated_user_2, test_farm):
    """Test that user cannot get irrigation history for another user's farm."""
    response = client.get(
        f"/api/v1/farms/{test_farm['id']}/irrigation/history",
        headers={"Authorization": f"Bearer {authenticated_user_2}"},
    )
    assert response.status_code == 403


def test_irrigation_history_limit(client, authenticated_user, test_farm):
    """Test getting irrigation history with custom limit."""
    response = client.get(
        f"/api/v1/farms/{test_farm['id']}/irrigation/history?limit=10",
        headers={"Authorization": f"Bearer {authenticated_user}"},
    )
    assert response.status_code == 200
    assert len(response.json()) <= 10


def test_irrigation_history_invalid_limit(client, authenticated_user, test_farm):
    """Test getting irrigation history with invalid limit (should clamp to 1000)."""
    response = client.get(
        f"/api/v1/farms/{test_farm['id']}/irrigation/history?limit=2000",
        headers={"Authorization": f"Bearer {authenticated_user}"},
    )
    # Should still work but use max limit of 1000
    assert response.status_code == 200
