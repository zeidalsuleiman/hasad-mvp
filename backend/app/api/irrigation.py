from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
import uuid
from app.database import get_db
from app.schemas.irrigation import IrrigationCalculateResponse, IrrigationResponse
from app.models.user import User
from app.models.farm import Farm
from app.models.weather import WeatherLog
from app.models.crop import FarmCrop
from app.services.farm_service import FarmService
from app.services.weather_service import WeatherService
from app.services.irrigation_service import IrrigationService
from app.api.deps import get_current_user

router = APIRouter()


@router.post("/{farm_id}/irrigation/calculate", response_model=IrrigationCalculateResponse)
def calculate_irrigation(
    farm_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Calculate and store irrigation recommendation for a farm.

    Uses current weather data and crop configuration to compute daily
    irrigation requirement using Hargreaves ET0 method.
    """
    # Validate farm ownership
    farm = FarmService.get_farm_by_id(db, farm_id)
    FarmService.check_ownership(farm, str(current_user.id))

    # Get active crop configuration
    crop = FarmService.get_farm_crop(db, farm_id)

    # Get or fetch current weather
    weather = WeatherService.get_latest_weather(db, farm_id)
    if not weather:
        # No cached weather, fetch and store it
        weather = WeatherService.fetch_and_log_weather(db, farm)

    if not weather:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to fetch weather data for calculation",
        )

    # Calculate irrigation recommendation
    recommendation = IrrigationService.calculate_irrigation(db, farm, weather, crop)

    return IrrigationCalculateResponse(
        id=recommendation.id,
        farm_id=recommendation.farm_id,
        weather_log_id=recommendation.weather_log_id,
        et0=recommendation.et0,
        kc=recommendation.kc,
        etc=recommendation.etc,
        effective_rainfall_mm=recommendation.effective_rainfall_mm,
        net_irrigation_mm=recommendation.net_irrigation_mm,
        recommendation_text=recommendation.recommendation_text,
        assumptions=recommendation.assumptions_json.get("assumptions", [])
        if recommendation.assumptions_json
        else [],
        created_at=recommendation.created_at,
    )


@router.get("/{farm_id}/irrigation/history", response_model=List[IrrigationResponse])
def get_irrigation_history(
    farm_id: str,
    limit: int = Query(default=100, ge=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get irrigation recommendation history for a farm."""
    # Validate farm ownership
    farm = FarmService.get_farm_by_id(db, farm_id)
    FarmService.check_ownership(farm, str(current_user.id))

    # Clamp limit to max of 1000
    limit = min(limit, 1000)

    # Get history
    recommendations = IrrigationService.get_irrigation_history(db, farm_id, limit)

    return [
        IrrigationResponse(
            id=rec.id,
            farm_id=rec.farm_id,
            weather_log_id=rec.weather_log_id,
            et0=rec.et0,
            kc=rec.kc,
            etc=rec.etc,
            effective_rainfall_mm=rec.effective_rainfall_mm,
            net_irrigation_mm=rec.net_irrigation_mm,
            recommendation_text=rec.recommendation_text,
            assumptions=rec.assumptions_json.get("assumptions", [])
            if rec.assumptions_json
            else [],
            created_at=rec.created_at,
        )
        for rec in recommendations
    ]
