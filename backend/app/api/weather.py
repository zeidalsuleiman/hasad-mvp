from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
import uuid
from app.database import get_db
from app.schemas.weather import WeatherResponse
from app.models.user import User
from app.models.farm import Farm
from app.models.weather import WeatherLog
from app.services.farm_service import FarmService
from app.services.weather_service import WeatherService
from app.api.deps import get_current_user

router = APIRouter()


@router.get("/{farm_id}/weather/current", response_model=WeatherResponse)
def get_current_weather(
    farm_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get or fetch current weather for a farm."""
    farm = FarmService.get_farm_by_id(db, farm_id)
    FarmService.check_ownership(farm, str(current_user.id))

    # Try to get recent weather (within last hour)
    from datetime import datetime, timedelta
    one_hour_ago = datetime.utcnow() - timedelta(hours=1)
    try:
        farm_uuid = uuid.UUID(farm_id)
    except (ValueError, AttributeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid farm ID format",
        )
    recent_weather = (
        db.query(WeatherLog)
        .filter(
            WeatherLog.farm_id == farm_uuid,
            WeatherLog.observed_at >= one_hour_ago
        )
        .order_by(WeatherLog.observed_at.desc())
        .first()
    )

    if recent_weather:
        return WeatherResponse.model_validate(recent_weather)

    # Fetch new weather data
    weather = WeatherService.fetch_and_log_weather(db, farm)
    return WeatherResponse.model_validate(weather)


@router.get("/{farm_id}/weather/history", response_model=List[WeatherResponse])
def get_weather_history(
    farm_id: str,
    limit: int = Query(default=100, ge=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get weather history for a farm."""
    farm = FarmService.get_farm_by_id(db, farm_id)
    FarmService.check_ownership(farm, str(current_user.id))

    # Clamp limit to max of 1000
    limit = min(limit, 1000)
    weather_logs = WeatherService.get_farm_weather_history(db, farm_id, limit)
    return [WeatherResponse.model_validate(log) for log in weather_logs]
