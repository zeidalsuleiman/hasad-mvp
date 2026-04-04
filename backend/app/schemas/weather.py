from datetime import datetime
from pydantic import BaseModel
from uuid import UUID
from typing import Optional


class WeatherResponse(BaseModel):
    id: UUID
    farm_id: UUID
    source: str
    observed_at: datetime
    temperature_c: Optional[float]
    humidity_pct: Optional[float]
    wind_speed_mps: Optional[float]
    pressure_hpa: Optional[float]
    rainfall_mm: Optional[float]
    cloud_pct: Optional[float]
    weather_description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
