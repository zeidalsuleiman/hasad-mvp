import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.core.llm import LLMProvider
from app.core.config import settings


@pytest.fixture
def mock_llm_response():
    """Mock LLM provider response."""
    return ("Based on your farm's data, here's what I can tell you:\n\nTemperature is 25°C\n\nHumidity is 65%\n\nNet irrigation is 0.5 mm/day", 42)


def test_llm_chat_success(client, authenticated_user, test_farm, mock_llm_response):
    """Test LLM chat integration with successful API call."""
    with patch("app.services.assistant_service.LLMProvider.complete") as mock_llm:
        mock_llm.return_value = mock_llm_response

        response = client.post(
            "/api/v1/assistant/chat",
            json={
                "farm_id": test_farm["id"],
                "message": "What's the temperature at my farm?",
            },
            headers={"Authorization": f"Bearer {authenticated_user}"},
        )

        assert response.status_code == 200

        data = response.json()
        assert "assistant_response" in data
        assert "sources_used" in data
        assert "data_references" in data
        assert "confidence_level" in data
        assert "tokens_used" in data
        assert data["tokens_used"] == 42


def test_llm_chat_without_api_key(client, authenticated_user, test_farm, monkeypatch):
    """Test LLM chat when API key is not configured."""
    # Temporarily remove the API key to simulate missing config
    monkeypatch.setattr(settings, "anthropic_api_key", None)

    response = client.post(
            "/api/v1/assistant/chat",
            json={
                "farm_id": test_farm["id"],
                "message": "Test question",
            },
            headers={"Authorization": f"Bearer {authenticated_user}"},
        )

    assert response.status_code == 503
    assert "AI service unavailable" in response.json()["detail"]


def test_llm_chat_without_farm(client, authenticated_user):
    """Test LLM chat with invalid farm_id."""
    response = client.post(
        "/api/v1/assistant/chat",
        json={
            "farm_id": "00000000-0000-0000-0000-000000000000",
            "message": "Test question",
        },
        headers={"Authorization": f"Bearer {authenticated_user}"},
    )

    assert response.status_code == 404


def test_llm_chat_other_users_farm(client, authenticated_user, authenticated_user_2, test_farm):
    """Test that user cannot use LLM chat for another user's farm."""
    response = client.post(
            "/api/v1/assistant/chat",
            json={
                "farm_id": test_farm["id"],
                "message": "Test question",
            },
            headers={"Authorization": f"Bearer {authenticated_user_2}"},
        )

    assert response.status_code == 403


def test_llm_chat_empty_message(client, authenticated_user, test_farm):
    """Test LLM chat with empty message."""
    response = client.post(
            "/api/v1/assistant/chat",
            json={
                "farm_id": test_farm["id"],
                "message": "",
            },
            headers={"Authorization": f"Bearer {authenticated_user}"},
        )

    assert response.status_code == 422


def test_llm_chat_long_message(client, authenticated_user, test_farm):
    """Test LLM chat with message exceeding max length."""
    response = client.post(
            "/api/v1/assistant/chat",
            json={
                "farm_id": test_farm["id"],
                "message": "x" * 1001,  # 1001 chars
            },
            headers={"Authorization": f"Bearer {authenticated_user}"},
        )

    assert response.status_code == 422