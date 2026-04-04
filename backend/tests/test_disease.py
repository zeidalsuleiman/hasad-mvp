import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from datetime import datetime


@pytest.fixture
def mock_disease_weather_response():
    """Mock weather response for disease risk calculation."""
    return {
        "main": {
            "temp": 25.0,
            "humidity": 65,
            "pressure": 1015,
        },
        "wind": {
            "speed": 3.0,
        },
        "weather": [
            {
                "description": "partly cloudy",
            }
        ],
        "clouds": {
            "all": 40,
        },
    }


def test_calculate_disease_risk_success(client, authenticated_user, test_farm, mock_disease_weather_response):
    """Test disease risk calculation with weather data."""
    # Mock weather API response
    with patch("app.services.weather_service.requests.get") as mock_get:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_disease_weather_response
        mock_response.raise_for_status = MagicMock()
        mock_get.return_value = mock_response

        # Calculate disease risk
        response = client.post(
            f"/api/v1/farms/{test_farm['id']}/disease-risk/calculate",
            headers={"Authorization": f"Bearer {authenticated_user}"},
        )

        assert response.status_code == 200

        data = response.json()
        assert "id" in data
        assert "disease_name" in data
        assert "risk_score" in data
        assert 0 <= data["risk_score"] <= 100
        assert "risk_level" in data
        assert data["risk_level"] in ["low", "medium", "high"]
        assert "triggered_rules" in data
        assert "explanation_text" in data


def test_calculate_disease_risk_without_auth(client, test_farm):
    """Test disease risk calculation without authentication."""
    response = client.post(
        f"/api/v1/farms/{test_farm['id']}/disease-risk/calculate",
    )
    assert response.status_code == 401


def test_calculate_disease_risk_other_users_farm(client, authenticated_user, authenticated_user_2, test_farm):
    """Test that user cannot calculate disease risk for another user's farm."""
    response = client.post(
        f"/api/v1/farms/{test_farm['id']}/disease-risk/calculate",
        headers={"Authorization": f"Bearer {authenticated_user_2}"},
    )
    assert response.status_code == 403


def test_disease_risk_high_humidity(client, authenticated_user, test_farm):
    """Test disease risk with high humidity (should increase risk score)."""
    # Mock weather with high humidity (>80%)
    mock_weather = {
        "main": {
            "temp": 25.0,
            "humidity": 85,
            "pressure": 1015,
        },
        "wind": {"speed": 3.0},
        "weather": [{"description": "humid"}],
        "clouds": {"all": 50},
    }

    with patch("app.services.weather_service.requests.get") as mock_get:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_weather
        mock_response.raise_for_status = MagicMock()
        mock_get.return_value = mock_response

        response = client.post(
            f"/api/v1/farms/{test_farm['id']}/disease-risk/calculate",
            headers={"Authorization": f"Bearer {authenticated_user}"},
        )

        assert response.status_code == 200

        data = response.json()
        # High humidity should trigger a risk rule
        assert len(data["triggered_rules"]) > 0


def test_disease_risk_with_rainfall(client, authenticated_user, test_farm):
    """Test disease risk with recent rainfall (should increase risk score)."""
    # Mock weather with rainfall
    mock_weather = {
        "main": {
            "temp": 25.0,
            "humidity": 70,
            "pressure": 1015,
        },
        "wind": {"speed": 3.0},
        "weather": [{"description": "rain"}],
        "clouds": {"all": 80},
        "rain": {"1h": 10.0},  # Significant rainfall
    }

    with patch("app.services.weather_service.requests.get") as mock_get:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_weather
        mock_response.raise_for_status = MagicMock()
        mock_get.return_value = mock_response

        response = client.post(
            f"/api/v1/farms/{test_farm['id']}/disease-risk/calculate",
            headers={"Authorization": f"Bearer {authenticated_user}"},
        )

        assert response.status_code == 200

        data = response.json()
        # Rainfall should trigger a risk rule
        assert len(data["triggered_rules"]) > 0


def test_disease_risk_low_conditions(client, authenticated_user, test_farm):
    """Test disease risk with unfavorable conditions (low humidity, low temp)."""
    # Mock weather with low risk conditions
    mock_weather = {
        "main": {
            "temp": 15.0,
            "humidity": 40,
            "pressure": 1015,
        },
        "wind": {"speed": 5.0},
        "weather": [{"description": "clear"}],
        "clouds": {"all": 20},
    }

    with patch("app.services.weather_service.requests.get") as mock_get:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_weather
        mock_response.raise_for_status = MagicMock()
        mock_get.return_value = mock_response

        response = client.post(
            f"/api/v1/farms/{test_farm['id']}/disease-risk/calculate",
            headers={"Authorization": f"Bearer {authenticated_user}"},
        )

        assert response.status_code == 200

        data = response.json()
        # Low risk conditions should result in low or medium risk
        assert data["risk_level"] in ["low", "medium"]


def test_disease_risk_high_conditions(client, authenticated_user, test_farm):
    """Test disease risk with favorable conditions for fungal disease."""
    # Mock weather with high risk conditions
    mock_weather = {
        "main": {
            "temp": 28.0,
            "humidity": 85,
            "pressure": 1015,
        },
        "wind": {"speed": 1.0},  # Low wind
        "weather": [{"description": "humid"}],
        "clouds": {"all": 80},
        "rain": {"1h": 8.0},  # Heavy rain
    }

    with patch("app.services.weather_service.requests.get") as mock_get:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_weather
        mock_response.raise_for_status = MagicMock()
        mock_get.return_value = mock_response

        response = client.post(
            f"/api/v1/farms/{test_farm['id']}/disease-risk/calculate",
            headers={"Authorization": f"Bearer {authenticated_user}"},
        )

        assert response.status_code == 200

        data = response.json()
        # Multiple high-risk conditions should result in high risk level
        assert len(data["triggered_rules"]) >= 3
        assert data["risk_score"] > 50


def test_disease_risk_history_empty(client, authenticated_user, test_farm):
    """Test getting disease risk history when no assessments exist."""
    response = client.get(
        f"/api/v1/farms/{test_farm['id']}/disease-risk/history",
        headers={"Authorization": f"Bearer {authenticated_user}"},
    )
    assert response.status_code == 200
    assert response.json() == []


def test_disease_risk_history_with_data(client, authenticated_user, test_farm, mock_disease_weather_response):
    """Test getting disease risk history with assessments."""
    # Create an assessment first
    with patch("app.services.weather_service.requests.get") as mock_get:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_disease_weather_response
        mock_response.raise_for_status = MagicMock()
        mock_get.return_value = mock_response

        client.post(
            f"/api/v1/farms/{test_farm['id']}/disease-risk/calculate",
            headers={"Authorization": f"Bearer {authenticated_user}"},
        )

    # Get history
    response = client.get(
        f"/api/v1/farms/{test_farm['id']}/disease-risk/history",
        headers={"Authorization": f"Bearer {authenticated_user}"},
    )

    assert response.status_code == 200

    data = response.json()
    assert len(data) > 0

    # Verify response structure
    entry = data[0]
    assert "id" in entry
    assert "disease_name" in entry
    assert "risk_score" in entry
    assert "risk_level" in entry
    assert "triggered_rules" in entry
    assert "explanation_text" in entry


def test_disease_risk_history_without_auth(client, test_farm):
    """Test getting disease risk history without authentication."""
    response = client.get(
        f"/api/v1/farms/{test_farm['id']}/disease-risk/history",
    )
    assert response.status_code == 401


def test_disease_risk_history_other_users_farm(client, authenticated_user, authenticated_user_2, test_farm):
    """Test that user cannot get disease risk history for another user's farm."""
    response = client.get(
        f"/api/v1/farms/{test_farm['id']}/disease-risk/history",
        headers={"Authorization": f"Bearer {authenticated_user_2}"},
    )
    assert response.status_code == 403


def test_disease_risk_history_limit(client, authenticated_user, test_farm):
    """Test getting disease risk history with custom limit."""
    response = client.get(
        f"/api/v1/farms/{test_farm['id']}/disease-risk/history?limit=10",
        headers={"Authorization": f"Bearer {authenticated_user}"},
    )
    assert response.status_code == 200
    assert len(response.json()) <= 10


def test_disease_risk_history_invalid_limit(client, authenticated_user, test_farm):
    """Test getting disease risk history with invalid limit (should clamp to 1000)."""
    response = client.get(
        f"/api/v1/farms/{test_farm['id']}/disease-risk/history?limit=2000",
        headers={"Authorization": f"Bearer {authenticated_user}"},
    )
    # Should still work but use max limit of 1000
    assert response.status_code == 200
