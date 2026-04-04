import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock


@pytest.fixture
def mock_weather_response():
    """Mock OpenWeatherMap API response."""
    return {
        "main": {
            "temp": 28.5,
            "feels_like": 30.2,
            "humidity": 65,
            "pressure": 1015,
        },
        "wind": {
            "speed": 3.5,
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


def test_get_current_weather_success(client, authenticated_user, test_farm, mock_weather_response):
    """Test getting current weather with mocked API."""
    with patch("app.services.weather_service.requests.get") as mock_get:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_weather_response
        mock_response.raise_for_status = MagicMock()
        mock_get.return_value = mock_response

        farm_id = test_farm["id"]
        response = client.get(
            f"/api/v1/farms/{farm_id}/weather/current",
            headers={"Authorization": f"Bearer {authenticated_user}"},
        )

        assert response.status_code == 200

        data = response.json()
        assert "id" in data
        assert data["farm_id"] == farm_id
        assert data["temperature_c"] == 28.5
        assert data["humidity_pct"] == 65
        assert data["pressure_hpa"] == 1015
        assert data["wind_speed_mps"] == 3.5
        assert data["weather_description"] == "clear sky"
        assert data["source"] == "openweathermap"


def test_get_current_weather_without_auth(client, test_farm):
    """Test getting current weather without authentication."""
    farm_id = test_farm["id"]
    response = client.get(f"/api/v1/farms/{farm_id}/weather/current")
    assert response.status_code == 401


def test_get_current_weather_other_users_farm(client, authenticated_user, authenticated_user_2, test_farm):
    """Test that user cannot get weather for another user's farm."""
    farm_id = test_farm["id"]
    response = client.get(
        f"/api/v1/farms/{farm_id}/weather/current",
        headers={"Authorization": f"Bearer {authenticated_user_2}"},
    )
    assert response.status_code == 403


def test_get_current_weather_cached(client, authenticated_user, test_farm, mock_weather_response):
    """Test that weather is cached for 1 hour."""
    with patch("app.services.weather_service.requests.get") as mock_get:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_weather_response
        mock_response.raise_for_status = MagicMock()
        mock_get.return_value = mock_response

        farm_id = test_farm["id"]

        # First call - should fetch from API
        response1 = client.get(
            f"/api/v1/farms/{farm_id}/weather/current",
            headers={"Authorization": f"Bearer {authenticated_user}"},
        )
        assert response1.status_code == 200
        assert mock_get.call_count == 1

        # Second call within cache period - should use cached data
        response2 = client.get(
            f"/api/v1/farms/{farm_id}/weather/current",
            headers={"Authorization": f"Bearer {authenticated_user}"},
        )
        assert response2.status_code == 200
        # Should not make another API call due to caching
        assert mock_get.call_count == 1


def test_get_weather_history_empty(client, authenticated_user, test_farm):
    """Test getting weather history when no logs exist."""
    farm_id = test_farm["id"]
    response = client.get(
        f"/api/v1/farms/{farm_id}/weather/history",
        headers={"Authorization": f"Bearer {authenticated_user}"},
    )
    assert response.status_code == 200
    assert response.json() == []


def test_get_weather_history_with_data(client, authenticated_user, test_farm, mock_weather_response):
    """Test getting weather history with logs."""
    with patch("app.services.weather_service.requests.get") as mock_get:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_weather_response
        mock_response.raise_for_status = MagicMock()
        mock_get.return_value = mock_response

        farm_id = test_farm["id"]

        # Create some weather logs by fetching multiple times
        # (Note: due to caching, these won't create multiple entries in current implementation)
        client.get(
            f"/api/v1/farms/{farm_id}/weather/current",
            headers={"Authorization": f"Bearer {authenticated_user}"},
        )

        # Get history
        response = client.get(
            f"/api/v1/farms/{farm_id}/weather/history",
            headers={"Authorization": f"Bearer {authenticated_user}"},
        )
        assert response.status_code == 200


def test_get_weather_history_without_auth(client, test_farm):
    """Test getting weather history without authentication."""
    farm_id = test_farm["id"]
    response = client.get(f"/api/v1/farms/{farm_id}/weather/history")
    assert response.status_code == 401


def test_get_weather_history_other_users_farm(client, authenticated_user, authenticated_user_2, test_farm):
    """Test that user cannot get weather history for another user's farm."""
    farm_id = test_farm["id"]
    response = client.get(
        f"/api/v1/farms/{farm_id}/weather/history",
        headers={"Authorization": f"Bearer {authenticated_user_2}"},
    )
    assert response.status_code == 403


def test_get_weather_history_limit(client, authenticated_user, test_farm):
    """Test getting weather history with custom limit."""
    farm_id = test_farm["id"]
    response = client.get(
        f"/api/v1/farms/{farm_id}/weather/history?limit=10",
        headers={"Authorization": f"Bearer {authenticated_user}"},
    )
    assert response.status_code == 200


def test_get_weather_history_invalid_limit(client, authenticated_user, test_farm):
    """Test getting weather history with invalid limit."""
    farm_id = test_farm["id"]
    response = client.get(
        f"/api/v1/farms/{farm_id}/weather/history?limit=2000",
        headers={"Authorization": f"Bearer {authenticated_user}"},
    )
    # Should still work but use max limit of 1000
    assert response.status_code == 200
