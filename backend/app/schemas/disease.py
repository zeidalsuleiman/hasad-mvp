from datetime import datetime
from pydantic import BaseModel, Field
from uuid import UUID
from typing import Optional, List


class DiseaseRiskCalculateResponse(BaseModel):
    """Response for disease risk calculation."""
    id: UUID
    farm_id: UUID
    weather_log_id: Optional[UUID]
    disease_name: str = Field(..., description="Name of the disease")
    risk_score: float = Field(..., ge=0, le=100, description="Risk score (0-100)")
    risk_level: str = Field(..., description="Risk level: low, medium, or high")
    triggered_rules: List[str] = Field(default_factory=list, description="List of triggered risk rules")
    explanation_text: str = Field(..., description="Human-readable explanation")
    created_at: datetime

    class Config:
        from_attributes = True


class DiseaseRiskResponse(BaseModel):
    """Simplified disease risk response (used in history)."""
    id: UUID
    farm_id: UUID
    weather_log_id: Optional[UUID]
    disease_name: str
    risk_score: float
    risk_level: str
    triggered_rules: List[str]
    explanation_text: str
    created_at: datetime

    class Config:
        from_attributes = True
