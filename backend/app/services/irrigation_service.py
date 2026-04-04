from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List
from datetime import datetime
import math
from app.models.irrigation import IrrigationRecommendation
from app.models.farm import Farm
from app.models.weather import WeatherLog
from app.models.crop import FarmCrop
from fastapi import HTTPException, status
import uuid


class IrrigationService:
    """Service for irrigation recommendation calculations."""

    # Crop coefficient (Kc) values by crop type and stage
    # Values based on FAO-56 guidelines for common crops
    KC_VALUES = {
        "Olive": {
            "Initial": 0.50,
            "Development": 0.70,
            "Mid-season": 0.75,
            "Late-season": 0.65,
            "Mature": 0.70,
        },
        "Tomato": {
            "Initial": 0.60,
            "Development": 0.80,
            "Mid-season": 1.15,
            "Late-season": 0.90,
            "Mature": 1.00,
        },
        "Cucumber": {
            "Initial": 0.50,
            "Development": 0.75,
            "Mid-season": 1.00,
            "Late-season": 0.85,
            "Mature": 0.90,
        },
        "Pepper": {
            "Initial": 0.60,
            "Development": 0.80,
            "Mid-season": 1.10,
            "Late-season": 0.90,
            "Mature": 1.00,
        },
        "Eggplant": {
            "Initial": 0.55,
            "Development": 0.80,
            "Mid-season": 1.10,
            "Late-season": 0.85,
            "Mature": 1.00,
        },
        "Potato": {
            "Initial": 0.50,
            "Development": 0.70,
            "Mid-season": 1.15,
            "Late-season": 0.75,
            "Mature": 0.85,
        },
        "Wheat": {
            "Initial": 0.40,
            "Development": 0.75,
            "Mid-season": 1.15,
            "Late-season": 0.40,
            "Mature": 0.80,
        },
        "Barley": {
            "Initial": 0.40,
            "Development": 0.75,
            "Mid-season": 1.10,
            "Late-season": 0.35,
            "Mature": 0.80,
        },
        "Citrus": {
            "Initial": 0.65,
            "Development": 0.70,
            "Mid-season": 0.70,
            "Late-season": 0.70,
            "Mature": 0.70,
        },
        "Grapes": {
            "Initial": 0.40,
            "Development": 0.75,
            "Mid-season": 0.90,
            "Late-season": 0.70,
            "Mature": 0.80,
        },
    }

    # Default Kc value if crop type/stage not found
    DEFAULT_KC = 0.70

    # Soil factors for effective rainfall calculation
    # Different soil types retain different amounts of rainfall
    SOIL_FACTORS = {
        "Sandy": 0.6,      # High drainage, less retention
        "Loamy": 0.7,       # Balanced
        "Clay": 0.8,         # High retention
        "Silt": 0.75,         # Moderate retention
        "Peat": 0.85,         # Very high retention
    }

    DEFAULT_SOIL_FACTOR = 0.7

    @staticmethod
    def calculate_irrigation(
        db: Session,
        farm: Farm,
        weather: WeatherLog,
        crop: Optional[FarmCrop] = None,
    ) -> IrrigationRecommendation:
        """
        Calculate irrigation recommendation using Hargreaves ET0 method.

        Pipeline:
        1. Calculate ET0 (reference evapotranspiration) using Hargreaves formula
        2. Get crop coefficient (Kc) based on crop type and stage
        3. Calculate ETc = ET0 * Kc (crop evapotranspiration)
        4. Adjust for effective rainfall
        5. Calculate net irrigation requirement
        6. Generate recommendation text
        """
        # Extract weather data
        temp_c = weather.temperature_c or 20.0
        humidity_pct = weather.humidity_pct or 50.0
        rainfall_mm = weather.rainfall_mm or 0.0

        # Step 1: Calculate ET0 using Hargreaves method
        et0 = IrrigationService.calculate_et0_hargreaves(
            temp_c=temp_c,
            latitude=farm.latitude,
            observation_date=weather.observed_at,
        )

        # Step 2: Get crop coefficient (Kc)
        if crop:
            kc = IrrigationService.get_crop_kc(
                crop_type=crop.crop_type,
                crop_stage=crop.crop_stage,
                override=crop.kc_value_override,
            )
        else:
            kc = IrrigationService.DEFAULT_KC

        # Step 3: Calculate crop evapotranspiration (ETc)
        etc = et0 * kc

        # Step 4: Calculate effective rainfall
        soil_factor = IrrigationService.get_soil_factor(farm.soil_type)
        effective_rainfall = rainfall_mm * soil_factor

        # Step 5: Calculate net irrigation requirement
        # Net irrigation = ETc - effective_rainfall
        net_irrigation_mm = max(0, etc - effective_rainfall)

        # Step 6: Generate recommendation text and assumptions
        recommendation_text, assumptions = IrrigationService.generate_recommendation(
            et0=et0,
            kc=kc,
            etc=etc,
            effective_rainfall=effective_rainfall,
            net_irrigation_mm=net_irrigation_mm,
            temp_c=temp_c,
            soil_type=farm.soil_type,
            crop_type=crop.crop_type if crop else "Unknown",
        )

        # Step 7: Save recommendation
        return IrrigationService.save_recommendation(
            db=db,
            farm_id=str(farm.id),
            weather_log_id=str(weather.id) if weather.id else None,
            et0=et0,
            kc=kc,
            etc=etc,
            effective_rainfall_mm=effective_rainfall,
            net_irrigation_mm=net_irrigation_mm,
            recommendation_text=recommendation_text,
            assumptions_json={"assumptions": assumptions},
        )

    @staticmethod
    def calculate_et0_hargreaves(
        temp_c: float,
        latitude: float,
        observation_date: Optional[datetime] = None,
    ) -> float:
        """
        Calculate reference evapotranspiration (ET0) using Hargreaves method.

        Formula: ET0 = 0.0023 * Ra * (Tmean + 17.8) * sqrt(Tmax - Tmin)

        Where:
        - Ra is extraterrestrial radiation (MJ/m²/day)
        - Tmean is mean temperature (°C)
        - (Tmax - Tmin) approximated from daily temperature variation

        Simplified approximation for MVP:
        - Use latitude-based radiation estimate
        - Assume ±5°C daily variation for temp range
        """
        # Default to current date if not provided
        if observation_date is None:
            observation_date = datetime.utcnow()

        # Day of year (1-365)
        day_of_year = observation_date.timetuple().tm_yday

        # Estimate extraterrestrial radiation (Ra) based on latitude and day of year
        # Simplified approximation for Jordan's latitude range (~30-34°N)
        lat_rad = math.radians(latitude)
        declination = 23.45 * math.sin(math.radians(360 * (284 + day_of_year) / 365))
        sunset_angle = math.acos(-math.tan(lat_rad) * math.tan(math.radians(declination)))

        # Solar constant and earth-sun distance factor
        dr = 1 + 0.033 * math.cos(2 * math.pi * day_of_year / 365)
        ra = 37.6 * dr * (sunset_angle * math.sin(lat_rad) * math.sin(math.radians(declination)) +
                              math.cos(lat_rad) * math.cos(math.radians(declination)) * math.sin(sunset_angle))

        # Hargreaves formula
        # Assume ±5°C daily temperature variation
        temp_range = 10.0  # Conservative estimate
        et0 = 0.0023 * ra * (temp_c + 17.8) * math.sqrt(temp_range)

        return max(0, et0)  # ET0 cannot be negative

    @staticmethod
    def get_crop_kc(
        crop_type: str,
        crop_stage: str,
        override: Optional[float] = None,
    ) -> float:
        """
        Get crop coefficient (Kc) for given crop type and stage.

        Uses FAO-56 Kc values as reference.
        User can override Kc value if they have crop-specific data.
        """
        # Use user override if provided
        if override is not None and override > 0:
            return float(override)

        # Look up Kc value from table
        try:
            kc_values = IrrigationService.KC_VALUES[crop_type]
            kc = kc_values.get(crop_stage, IrrigationService.DEFAULT_KC)
            return float(kc)
        except KeyError:
            return IrrigationService.DEFAULT_KC

    @staticmethod
    def get_soil_factor(soil_type: str) -> float:
        """
        Get soil factor for effective rainfall calculation.

        Different soil types retain different amounts of rainfall:
        - Sandy soils drain quickly (lower factor)
        - Clay soils retain more (higher factor)
        """
        return IrrigationService.SOIL_FACTORS.get(
            soil_type, IrrigationService.DEFAULT_SOIL_FACTOR
        )

    @staticmethod
    def generate_recommendation(
        et0: float,
        kc: float,
        etc: float,
        effective_rainfall: float,
        net_irrigation_mm: float,
        temp_c: float,
        soil_type: str,
        crop_type: str,
    ) -> tuple[str, List[str]]:
        """
        Generate human-readable recommendation text and list of assumptions.

        Returns: (recommendation_text, assumptions_list)
        """
        assumptions = [
            f"Reference evapotranspiration (ET0) calculated using Hargreaves method: {et0:.2f} mm/day",
            f"Crop coefficient (Kc) for {crop_type}: {kc:.2f}",
            f"Crop evapotranspiration (ETc): {etc:.2f} mm/day",
            f"Effective rainfall (soil-adjusted): {effective_rainfall:.2f} mm",
            f"Soil type: {soil_type} (retention factor applied)",
            f"Net irrigation requirement: {net_irrigation_mm:.2f} mm/day",
        ]

        if net_irrigation_mm < 1.0:
            recommendation_text = (
                f"No irrigation needed today. Recent rainfall and current conditions "
                f"are sufficient for your {crop_type} crop. Monitor soil moisture "
                f"and consider irrigation if dry conditions persist."
            )
        elif net_irrigation_mm < 3.0:
            recommendation_text = (
                f"Light irrigation recommended: {net_irrigation_mm:.1f} mm. "
                f"Current temperature ({temp_c:.1f}°C) and moderate ETc ({etc:.2f} mm/day) "
                f"indicate minimal water stress risk for your {crop_type} crop."
            )
        elif net_irrigation_mm < 6.0:
            recommendation_text = (
                f"Moderate irrigation recommended: {net_irrigation_mm:.1f} mm. "
                f"With current conditions (temp: {temp_c:.1f}°C, ETc: {etc:.2f} mm/day), "
                f"your {crop_type} crop would benefit from regular watering to maintain "
                f"optimal growth."
            )
        else:
            recommendation_text = (
                f"Heavy irrigation recommended: {net_irrigation_mm:.1f} mm. "
                f"High evapotranspiration rate ({etc:.2f} mm/day) due to "
                f"temperature ({temp_c:.1f}°C) indicates significant water demand. "
                f"Ensure adequate irrigation for your {crop_type} crop."
            )

        return recommendation_text, assumptions

    @staticmethod
    def save_recommendation(
        db: Session,
        farm_id: str,
        weather_log_id: Optional[str],
        et0: float,
        kc: float,
        etc: float,
        effective_rainfall_mm: float,
        net_irrigation_mm: float,
        recommendation_text: str,
        assumptions_json: Dict[str, Any],
    ) -> IrrigationRecommendation:
        """Save irrigation recommendation to database."""
        try:
            farm_uuid = uuid.UUID(farm_id)
        except (ValueError, AttributeError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid farm ID format",
            )

        weather_log_uuid = None
        if weather_log_id:
            try:
                weather_log_uuid = uuid.UUID(weather_log_id)
            except (ValueError, AttributeError):
                pass

        db_recommendation = IrrigationRecommendation(
            farm_id=farm_uuid,
            weather_log_id=weather_log_uuid,
            et0=et0,
            kc=kc,
            etc=etc,
            effective_rainfall_mm=effective_rainfall_mm,
            net_irrigation_mm=net_irrigation_mm,
            recommendation_text=recommendation_text,
            assumptions_json=assumptions_json,
        )
        db.add(db_recommendation)
        db.commit()
        db.refresh(db_recommendation)
        return db_recommendation

    @staticmethod
    def get_irrigation_history(
        db: Session, farm_id: str, limit: int = 100
    ) -> List[IrrigationRecommendation]:
        """Get irrigation recommendation history for a farm."""
        try:
            farm_uuid = uuid.UUID(farm_id)
        except (ValueError, AttributeError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid farm ID format",
            )
        return (
            db.query(IrrigationRecommendation)
            .filter(IrrigationRecommendation.farm_id == farm_uuid)
            .order_by(IrrigationRecommendation.created_at.desc())
            .limit(limit)
            .all()
        )
