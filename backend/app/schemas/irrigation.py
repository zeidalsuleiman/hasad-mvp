from datetime import datetime
from pydantic import BaseModel, Field
from uuid import UUID
from typing import Optional, List


class IrrigationCalculateResponse(BaseModel):
    """Response for irrigation calculation."""
    id: UUID
    farm_id: UUID
    weather_log_id: Optional[UUID]
    et0: Optional[float] = Field(..., description="Reference evapotranspiration (mm/day)")
    kc: Optional[float] = Field(..., description="Crop coefficient")
    etc: Optional[float] = Field(..., description="Crop evapotranspiration (mm/day)")
    effective_rainfall_mm: Optional[float] = Field(..., description="Effective rainfall (mm)")
    net_irrigation_mm: Optional[float] = Field(..., description="Net irrigation requirement (mm)")
    recommendation_text: str = Field(..., description="Human-readable recommendation")
    assumptions: List[str] = Field(default_factory=list, description="Full calculation log")
    et0_method: Optional[str] = Field(
        None,
        description="ET0 method used: 'penman-monteith' or 'hargreaves'",
    )
    created_at: datetime

    class Config:
        from_attributes = True


class IrrigationResponse(BaseModel):
    """Simplified irrigation response (used in history)."""
    id: UUID
    farm_id: UUID
    weather_log_id: Optional[UUID]
    et0: Optional[float]
    kc: Optional[float]
    etc: Optional[float]
    effective_rainfall_mm: Optional[float]
    net_irrigation_mm: Optional[float]
    recommendation_text: str
    assumptions: List[str]
    et0_method: Optional[str] = Field(
        None,
        description="ET0 method used: 'penman-monteith' or 'hargreaves'",
    )
    created_at: datetime

    class Config:
        from_attributes = True
