from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.farm import Farm
from app.models.crop import FarmCrop
from app.schemas.farm import FarmCreate, FarmUpdate
from app.schemas.crop import CropCreate, CropUpdate
from fastapi import HTTPException, status
import uuid


class FarmService:
    """Service for farm management operations."""

    @staticmethod
    def get_user_farms(db: Session, user_id: str) -> List[Farm]:
        """Get all farms for a user."""
        try:
            user_uuid = uuid.UUID(user_id)
        except (ValueError, AttributeError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user ID format",
            )
        return db.query(Farm).filter(Farm.user_id == user_uuid).all()

    @staticmethod
    def get_farm_by_id(db: Session, farm_id: str) -> Farm:
        """Get a farm by ID."""
        try:
            farm_uuid = uuid.UUID(farm_id)
        except (ValueError, AttributeError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid farm ID format",
            )
        farm = db.query(Farm).filter(Farm.id == farm_uuid).first()
        if not farm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Farm not found",
            )
        return farm

    @staticmethod
    def check_ownership(farm: Farm, user_id: str) -> None:
        """Check if a user owns a farm."""
        try:
            user_uuid = uuid.UUID(user_id)
        except (ValueError, AttributeError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user ID format",
            )
        if farm.user_id != user_uuid:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this farm",
            )

    @staticmethod
    def create_farm(db: Session, user_id: str, farm_data: FarmCreate) -> Farm:
        """Create a new farm for a user."""
        try:
            user_uuid = uuid.UUID(user_id)
        except (ValueError, AttributeError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user ID format",
            )
        db_farm = Farm(
            user_id=user_uuid,
            name=farm_data.name,
            latitude=farm_data.latitude,
            longitude=farm_data.longitude,
            area_dunum=farm_data.area_dunum,
            soil_type=farm_data.soil_type,
            irrigation_method=farm_data.irrigation_method,
            notes=farm_data.notes,
        )
        db.add(db_farm)
        db.commit()
        db.refresh(db_farm)
        return db_farm

    @staticmethod
    def update_farm(db: Session, farm: Farm, farm_data: FarmUpdate) -> Farm:
        """Update a farm."""
        update_data = farm_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(farm, field, value)
        db.commit()
        db.refresh(farm)
        return farm

    @staticmethod
    def delete_farm(db: Session, farm: Farm) -> None:
        """Delete a farm."""
        db.delete(farm)
        db.commit()

    @staticmethod
    def get_farm_crop(db: Session, farm_id: str) -> Optional[FarmCrop]:
        """Get active crop configuration for a farm."""
        try:
            farm_uuid = uuid.UUID(farm_id)
        except (ValueError, AttributeError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid farm ID format",
            )
        return (
            db.query(FarmCrop)
            .filter(FarmCrop.farm_id == farm_uuid, FarmCrop.is_active == True)
            .first()
        )

    @staticmethod
    def create_crop(db: Session, farm_id: str, crop_data: CropCreate) -> FarmCrop:
        """Create a crop configuration for a farm."""
        try:
            farm_uuid = uuid.UUID(farm_id)
        except (ValueError, AttributeError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid farm ID format",
            )
        # Deactivate existing crops
        db.query(FarmCrop).filter(FarmCrop.farm_id == farm_uuid).update(
            {"is_active": False}
        )

        db_crop = FarmCrop(
            farm_id=farm_uuid,
            crop_type=crop_data.crop_type,
            crop_stage=crop_data.crop_stage,
            planting_date=crop_data.planting_date,
            root_depth_m=crop_data.root_depth_m,
            kc_value_override=crop_data.kc_value_override,
            is_active=True,
        )
        db.add(db_crop)
        db.commit()
        db.refresh(db_crop)
        return db_crop

    @staticmethod
    def update_crop(db: Session, crop: FarmCrop, crop_data: CropUpdate) -> FarmCrop:
        """Update a crop configuration."""
        update_data = crop_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(crop, field, value)
        db.commit()
        db.refresh(crop)
        return crop
