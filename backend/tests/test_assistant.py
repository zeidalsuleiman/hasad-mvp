import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock


@pytest.fixture
def mock_llm_response():
    """Mock LLM provider response for Phase 3 tests."""
    return "Based on your farm's data, here's what I can tell you. Your Wheat crop in Mid-season stage looks healthy.", 42


def test_chat_success_full_context(client, authenticated_user, test_farm, mock_irrigation_weather_response, mock_llm_response):
    """Test chat with full context (farm + crop + weather + irrigation + disease)."""
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

    # Create irrigation and disease data
    from app.services.weather_service import requests

    # Mock weather API response
    with patch("app.services.weather_service.requests.get") as mock_get:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_irrigation_weather_response
        mock_response.raise_for_status = MagicMock()
        mock_get.return_value = mock_response

        # Create irrigation calculation
        client.post(
            f"/api/v1/farms/{test_farm['id']}/irrigation/calculate",
            headers={"Authorization": f"Bearer {authenticated_user}"},
        )

        # Create disease risk calculation
        client.post(
            f"/api/v1/farms/{test_farm['id']}/disease-risk/calculate",
            headers={"Authorization": f"Bearer {authenticated_user}"},
        )

    # Chat request with LLM mocking
    with patch("app.services.assistant_service.LLMProvider.complete") as mock_llm:
        mock_llm.return_value = mock_llm_response
        response = client.post(
            "/api/v1/assistant/chat",
            json={
                "farm_id": test_farm["id"],
                "message": "How should I irrigate my tomato crop today?",
            },
            headers={"Authorization": f"Bearer {authenticated_user}"},
        )

    assert response.status_code == 200

    data = response.json()
    assert "assistant_response" in data
    assert "sources_used" in data
    assert "data_references" in data
    assert "confidence_level" in data

    # Should have high confidence with all data available
    assert data["confidence_level"] == "high"

    # Should cite all sources
    assert "weather" in data["sources_used"]
    assert "irrigation" in data["sources_used"]
    assert "disease_risk" in data["sources_used"]

    # Data references should contain farm info
    assert "farm" in data["data_references"]
    assert data["data_references"]["farm"]["name"] == test_farm["name"]


def test_chat_partial_context(client, authenticated_user, test_farm, mock_irrigation_weather_response, mock_llm_response):
    """Test chat with partial context (farm + weather + irrigation)."""
    with patch("app.services.weather_service.requests.get") as mock_get:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_irrigation_weather_response
        mock_response.raise_for_status = MagicMock()
        mock_get.return_value = mock_response

        # Create irrigation calculation (which also creates weather data)
        client.post(
            f"/api/v1/farms/{test_farm['id']}/irrigation/calculate",
            headers={"Authorization": f"Bearer {authenticated_user}"},
        )

    # Chat request with LLM mocking
    with patch("app.services.assistant_service.LLMProvider.complete") as mock_llm:
        mock_llm.return_value = mock_llm_response
        response = client.post(
            "/api/v1/assistant/chat",
            json={
                "farm_id": test_farm["id"],
                "message": "What's the weather at my farm?",
            },
            headers={"Authorization": f"Bearer {authenticated_user}"},
        )

    assert response.status_code == 200

    data = response.json()
    assert "assistant_response" in data
    assert "confidence_level" in data

    # Should have medium confidence with weather + irrigation data
    assert data["confidence_level"] == "medium"


def test_chat_no_context(client, authenticated_user, test_farm, mock_llm_response):
    """Test chat with no context (farm only, no calculations)."""
    # Chat request without any prior calculations
    with patch("app.services.assistant_service.LLMProvider.complete") as mock_llm:
        mock_llm.return_value = mock_llm_response
        response = client.post(
            "/api/v1/assistant/chat",
            json={
                "farm_id": test_farm["id"],
                "message": "What crops grow well in sandy soil?",
            },
            headers={"Authorization": f"Bearer {authenticated_user}"},
        )

    assert response.status_code == 200

    data = response.json()
    assert "assistant_response" in data
    assert "confidence_level" in data

    # Should have low confidence with no data
    assert data["confidence_level"] == "low"

    # Should only cite farm source
    assert "farm" in data["data_references"]
    assert data["data_references"]["weather"]["available"] == False
    assert data["data_references"]["irrigation"]["available"] == False
    assert data["data_references"]["disease_risk"]["available"] == False


def test_chat_without_auth(client, test_farm):
    """Test chat without authentication."""
    response = client.post(
        "/api/v1/assistant/chat",
        json={
            "farm_id": test_farm["id"],
            "message": "Test message",
        },
    )

    assert response.status_code == 401


def test_chat_other_users_farm(client, authenticated_user, authenticated_user_2, test_farm):
    """Test that user cannot chat about another user's farm."""
    response = client.post(
        "/api/v1/assistant/chat",
        json={
            "farm_id": test_farm["id"],
            "message": "Test message",
        },
        headers={"Authorization": f"Bearer {authenticated_user_2}"},
    )

    assert response.status_code == 403


def test_chat_invalid_farm_id(client, authenticated_user):
    """Test chat with invalid farm ID."""
    response = client.post(
        "/api/v1/assistant/chat",
        json={
            "farm_id": "00000000-0000-0000-0000-000000000000",
            "message": "Test message",
        },
        headers={"Authorization": f"Bearer {authenticated_user}"},
    )

    assert response.status_code == 404


def test_chat_empty_message(client, authenticated_user, test_farm):
    """Test chat with empty message."""
    response = client.post(
        "/api/v1/assistant/chat",
        json={
            "farm_id": test_farm["id"],
            "message": "",
        },
        headers={"Authorization": f"Bearer {authenticated_user}"},
    )

    assert response.status_code == 422  # Validation error


def test_chat_long_message(client, authenticated_user, test_farm):
    """Test chat with message exceeding max length."""
    response = client.post(
        "/api/v1/assistant/chat",
        json={
            "farm_id": test_farm["id"],
            "message": "x" * 1001,  # 1001 chars
        },
        headers={"Authorization": f"Bearer {authenticated_user}"},
    )

    assert response.status_code == 422  # Validation error


def test_chat_context_includes_crop(client, authenticated_user, test_farm, mock_irrigation_weather_response, mock_llm_response):
    """Test that response includes crop configuration in context."""
    # Create a crop
    crop_data = {
        "crop_type": "Wheat",
        "crop_stage": "Mid-season",
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

        # Chat request
        with patch("app.services.assistant_service.LLMProvider.complete") as mock_llm:
            mock_llm.return_value = mock_llm_response
            response = client.post(
                "/api/v1/assistant/chat",
                json={
                    "farm_id": test_farm["id"],
                    "message": "Is my wheat crop healthy?",
                },
                headers={"Authorization": f"Bearer {authenticated_user}"},
            )

    assert response.status_code == 200

    data = response.json()
    # Response should mention the crop in context
    assert "Wheat" in data["assistant_response"] or "Mid-season" in data["assistant_response"]


@pytest.fixture
def mock_irrigation_weather_response():
    """Mock weather response for chat tests."""
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
                "description": "clear sky",
            }
        ],
        "clouds": {
            "all": 40,
        },
    }
