from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
import uuid
from app.database import get_db
from app.schemas.disease import DiseaseRiskCalculateResponse, DiseaseRiskResponse
from app.models.user import User
from app.models.farm import Farm
from app.models.weather import WeatherLog
from app.models.crop import FarmCrop
from app.services.farm_service import FarmService
from app.services.weather_service import WeatherService
from app.services.disease_service import DiseaseService
from app.api.deps import get_current_user

router = APIRouter()


@router.post("/{farm_id}/disease-risk/calculate", response_model=DiseaseRiskCalculateResponse)
def calculate_disease_risk(
    farm_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Calculate and store disease risk assessment for a farm.

    Uses current weather data to evaluate fungal disease risk
    using a rule-based model (version 1).
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
            detail="Unable to fetch weather data for risk calculation",
        )

    # Calculate disease risk
    assessment = DiseaseService.calculate_disease_risk(db, farm, weather, crop)

    return DiseaseRiskCalculateResponse(
        id=assessment.id,
        farm_id=assessment.farm_id,
        weather_log_id=assessment.weather_log_id,
        disease_name=assessment.disease_name,
        risk_score=assessment.risk_score,
        risk_level=assessment.risk_level,
        triggered_rules=assessment.triggered_rules_json.get("rules", [])
        if assessment.triggered_rules_json
        else [],
        explanation_text=assessment.explanation_text,
        created_at=assessment.created_at,
    )


@router.get("/{farm_id}/disease-risk/history", response_model=List[DiseaseRiskResponse])
def get_disease_risk_history(
    farm_id: str,
    limit: int = Query(default=100, ge=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get disease risk assessment history for a farm."""
    # Validate farm ownership
    farm = FarmService.get_farm_by_id(db, farm_id)
    FarmService.check_ownership(farm, str(current_user.id))

    # Clamp limit to max of 1000
    limit = min(limit, 1000)

    # Get history
    assessments = DiseaseService.get_disease_history(db, farm_id, limit)

    return [
        DiseaseRiskResponse(
            id=assessment.id,
            farm_id=assessment.farm_id,
            weather_log_id=assessment.weather_log_id,
            disease_name=assessment.disease_name,
            risk_score=assessment.risk_score,
            risk_level=assessment.risk_level,
            triggered_rules=assessment.triggered_rules_json.get("rules", [])
            if assessment.triggered_rules_json
            else [],
            explanation_text=assessment.explanation_text,
            created_at=assessment.created_at,
        )
        for assessment in assessments
    ]
