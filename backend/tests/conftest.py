import pytest
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Set test API key for weather BEFORE importing app modules
os.environ["OPENWEATHER_API_KEY"] = "test-api-key"

from app.main import app
from app.database import Base, get_db
from app.core.config import settings
from app.models import User, Farm, FarmCrop, WeatherLog

# Use SQLite for testing
TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture
def db_session():
    """Create a fresh database session for each test."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(db_session):
    """Create a test client with database session override."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_user_data():
    """Return test user data."""
    return {
        "full_name": "Test Farmer",
        "email": "test@example.com",
        "password": "SecurePass123!",
    }


@pytest.fixture
def test_farm_data():
    """Return test farm data."""
    return {
        "name": "Test Farm",
        "latitude": 32.5568,
        "longitude": 35.8728,
        "area_dunum": 5.5,
        "soil_type": "Loam",
        "irrigation_method": "Drip",
        "notes": "Test farm notes",
    }


@pytest.fixture
def test_crop_data():
    """Return test crop data."""
    return {
        "crop_type": "Olive",
        "crop_stage": "Mature",
        "planting_date": "2023-03-15T00:00:00",
        "root_depth_m": 0.8,
        "kc_value_override": 0.6,
    }


@pytest.fixture
def authenticated_user_response(client, test_user_data):
    """Create and authenticate a test user, return full response."""
    response = client.post("/api/v1/auth/register", json=test_user_data)
    assert response.status_code == 201
    return response.json()


@pytest.fixture
def authenticated_user(authenticated_user_response):
    """Return the access token from authenticated user response."""
    return authenticated_user_response["access_token"]


@pytest.fixture
def authenticated_user_2(client):
    """Create and authenticate a second test user."""
    user_data = {
        "full_name": "Second Farmer",
        "email": "second@example.com",
        "password": "SecurePass456!",
    }
    response = client.post("/api/v1/auth/register", json=user_data)
    assert response.status_code == 201
    data = response.json()
    return data["access_token"]


@pytest.fixture
def test_farm(client, authenticated_user, test_farm_data):
    """Create a test farm."""
    response = client.post(
        "/api/v1/farms",
        json=test_farm_data,
        headers={"Authorization": f"Bearer {authenticated_user}"},
    )
    assert response.status_code == 201
    return response.json()
