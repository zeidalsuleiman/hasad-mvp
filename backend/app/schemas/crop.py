from datetime import datetime
from pydantic import BaseModel, Field
from uuid import UUID
from typing import Optional


class CropCreate(BaseModel):
    crop_type: str = Field(..., min_length=1, max_length=100)
    crop_stage: str = Field(..., min_length=1, max_length=100)
    planting_date: Optional[datetime] = None
    root_depth_m: Optional[float] = Field(None, ge=0)
    kc_value_override: Optional[float] = Field(None, ge=0)


class CropUpdate(BaseModel):
    crop_type: Optional[str] = Field(None, min_length=1, max_length=100)
    crop_stage: Optional[str] = Field(None, min_length=1, max_length=100)
    planting_date: Optional[datetime] = None
    root_depth_m: Optional[float] = Field(None, ge=0)
    kc_value_override: Optional[float] = Field(None, ge=0)


class CropResponse(BaseModel):
    id: UUID
    crop_type: str
    crop_stage: str
    planting_date: Optional[datetime]
    root_depth_m: Optional[float]
    kc_value_override: Optional[float]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    # Computed fields — populated by the route handler, not stored in DB
    kc_effective: Optional[float] = None
    kc_source: Optional[str] = None

    class Config:
        from_attributes = True
