from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.farm import FarmCreate, FarmUpdate, FarmResponse
from app.schemas.crop import CropCreate, CropUpdate, CropResponse
from app.models.user import User
from app.models.farm import Farm
from app.models.crop import FarmCrop
from app.services.farm_service import FarmService
from app.api.deps import get_current_user

router = APIRouter()


@router.get("", response_model=List[FarmResponse])
def list_farms(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all farms for the current user."""
    farms = FarmService.get_user_farms(db, str(current_user.id))
    return [FarmResponse.model_validate(farm) for farm in farms]


@router.post("", response_model=FarmResponse, status_code=status.HTTP_201_CREATED)
def create_farm(
    farm_data: FarmCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new farm."""
    farm = FarmService.create_farm(db, str(current_user.id), farm_data)
    return FarmResponse.model_validate(farm)


@router.get("/{farm_id}", response_model=FarmResponse)
def get_farm(
    farm_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific farm."""
    farm = FarmService.get_farm_by_id(db, farm_id)
    FarmService.check_ownership(farm, str(current_user.id))
    return FarmResponse.model_validate(farm)


@router.patch("/{farm_id}", response_model=FarmResponse)
def update_farm(
    farm_id: str,
    farm_data: FarmUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a farm."""
    farm = FarmService.get_farm_by_id(db, farm_id)
    FarmService.check_ownership(farm, str(current_user.id))
    updated_farm = FarmService.update_farm(db, farm, farm_data)
    return FarmResponse.model_validate(updated_farm)


@router.delete("/{farm_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_farm(
    farm_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a farm."""
    farm = FarmService.get_farm_by_id(db, farm_id)
    FarmService.check_ownership(farm, str(current_user.id))
    FarmService.delete_farm(db, farm)


@router.get("/{farm_id}/crop", response_model=CropResponse)
def get_farm_crop(
    farm_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the crop configuration for a farm."""
    farm = FarmService.get_farm_by_id(db, farm_id)
    FarmService.check_ownership(farm, str(current_user.id))
    crop = FarmService.get_farm_crop(db, farm_id)
    if not crop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No crop configuration found for this farm",
        )
    return CropResponse.model_validate(crop)


@router.post("/{farm_id}/crop", response_model=CropResponse, status_code=status.HTTP_201_CREATED)
def create_farm_crop(
    farm_id: str,
    crop_data: CropCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create or update the crop configuration for a farm."""
    farm = FarmService.get_farm_by_id(db, farm_id)
    FarmService.check_ownership(farm, str(current_user.id))
    crop = FarmService.create_crop(db, farm_id, crop_data)
    return CropResponse.model_validate(crop)


@router.patch("/{farm_id}/crop", response_model=CropResponse)
def update_farm_crop(
    farm_id: str,
    crop_data: CropUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update the crop configuration for a farm."""
    farm = FarmService.get_farm_by_id(db, farm_id)
    FarmService.check_ownership(farm, str(current_user.id))
    crop = FarmService.get_farm_crop(db, farm_id)
    if not crop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No crop configuration found for this farm",
        )
    updated_crop = FarmService.update_crop(db, crop, crop_data)
    return CropResponse.model_validate(updated_crop)
