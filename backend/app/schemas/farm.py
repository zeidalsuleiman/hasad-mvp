from datetime import datetime
from pydantic import BaseModel, Field
from uuid import UUID
from typing import Optional


class FarmCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    area_dunum: Optional[float] = Field(None, ge=0)
    soil_type: str = Field(..., min_length=1, max_length=100)
    irrigation_method: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = Field(None, max_length=1000)


class FarmUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    area_dunum: Optional[float] = Field(None, ge=0)
    soil_type: Optional[str] = Field(None, min_length=1, max_length=100)
    irrigation_method: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = Field(None, max_length=1000)


class FarmResponse(BaseModel):
    id: UUID
    name: str
    latitude: float
    longitude: float
    area_dunum: Optional[float]
    soil_type: str
    irrigation_method: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
