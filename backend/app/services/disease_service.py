from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List, Tuple
from datetime import datetime
from app.models.disease import DiseaseRiskAssessment
from app.models.farm import Farm
from app.models.weather import WeatherLog
from app.models.crop import FarmCrop
from fastapi import HTTPException, status
import uuid


class DiseaseService:
    """Service for disease risk assessment.

    Version 1 uses a generic rule-based model that can be
    replaced by a trained ML model in future versions.
    """

    # Generic disease type for MVP
    DISEASE_NAME = "General Fungal Risk"

    # Risk level thresholds
    RISK_LOW_THRESHOLD = 33
    RISK_HIGH_THRESHOLD = 67

    # Generic fungal disease risk rules
    # These are evidence-based rules for common fungal disease conditions
    RULES = {
        "high_humidity_leaf_wetness": {
            "description": "High humidity (>80%) promotes fungal spore germination and infection",
            "weight": 25,
            "condition": lambda w: (w.humidity_pct or 0) > 80,
        },
        "moderate_humidity_moderate_temp": {
            "description": "Moderate humidity (60-80%) with warm temps (20-30°C) creates favorable conditions",
            "weight": 15,
            "condition": lambda w: 60 < (w.humidity_pct or 0) <= 80 and 20 < (w.temperature_c or 0) <= 30,
        },
        "recent_rainfall": {
            "description": "Recent rainfall (>5mm) creates moisture film on plant surfaces",
            "weight": 20,
            "condition": lambda w: (w.rainfall_mm or 0) > 5,
        },
        "high_temperature_stress": {
            "description": "High temperatures (>30°C) stress plants, increasing susceptibility",
            "weight": 15,
            "condition": lambda w: (w.temperature_c or 0) > 30,
        },
        "low_wind_stagnation": {
            "description": "Low wind speed (<2 m/s) reduces natural spore dispersal",
            "weight": 10,
            "condition": lambda w: (w.wind_speed_mps or 0) < 2,
        },
        "cloud_cover": {
            "description": "Heavy cloud cover (>70%) maintains humid conditions",
            "weight": 10,
            "condition": lambda w: (w.cloud_pct or 0) > 70,
        },
    }

    @staticmethod
    def calculate_disease_risk(
        db: Session,
        farm: Farm,
        weather: WeatherLog,
        crop: Optional[FarmCrop] = None,
    ) -> DiseaseRiskAssessment:
        """
        Calculate disease risk assessment using rule-based model.

        Version 1: Generic fungal disease risk based on weather conditions.
        This can be replaced by a trained ML model in future versions.

        Pipeline:
        1. Evaluate all rules against weather conditions
        2. Calculate risk score from triggered rules
        3. Determine risk level based on score
        4. Generate explanation text
        """
        # Step 1: Evaluate rules
        triggered_rules: List[Tuple[str, int]] = []
        for rule_name, rule_config in DiseaseService.RULES.items():
            if rule_config["condition"](weather):
                triggered_rules.append(
                    (rule_config["description"], rule_config["weight"])
                )

        # Step 2: Calculate risk score
        risk_score = sum(weight for _, weight in triggered_rules)
        # Clamp score to 0-100 range
        risk_score = min(100, max(0, risk_score))

        # Step 3: Determine risk level
        risk_level = DiseaseService.get_risk_level(risk_score)

        # Step 4: Generate explanation text
        explanation = DiseaseService.generate_explanation(
            risk_score=risk_score,
            risk_level=risk_level,
            triggered_rules=triggered_rules,
            crop_type=crop.crop_type if crop else "Unknown",
        )

        # Step 5: Save assessment
        return DiseaseService.save_assessment(
            db=db,
            farm_id=str(farm.id),
            weather_log_id=str(weather.id) if weather.id else None,
            disease_name=DiseaseService.DISEASE_NAME,
            risk_score=risk_score,
            risk_level=risk_level,
            triggered_rules_json={"rules": [desc for desc, _ in triggered_rules]},
            explanation_text=explanation,
        )

    @staticmethod
    def get_risk_level(risk_score: float) -> str:
        """
        Convert risk score to risk level.

        0-33: Low risk
        34-66: Medium risk
        67-100: High risk
        """
        if risk_score < DiseaseService.RISK_LOW_THRESHOLD:
            return "low"
        elif risk_score < DiseaseService.RISK_HIGH_THRESHOLD:
            return "medium"
        else:
            return "high"

    @staticmethod
    def generate_explanation(
        risk_score: float,
        risk_level: str,
        triggered_rules: List[Tuple[str, int]],
        crop_type: str,
    ) -> str:
        """
        Generate human-readable explanation for the risk assessment.

        Provides context about the current risk level and key factors
        that contribute to the risk score.
        """
        if risk_level == "low":
            base_explanation = (
                f"Low fungal disease risk for your {crop_type} crop. "
                f"Current weather conditions are not favorable for "
                f"fungal pathogen development."
            )
        elif risk_level == "medium":
            base_explanation = (
                f"Moderate fungal disease risk for your {crop_type} crop. "
                f"Current conditions could support fungal disease development. "
                f"Monitor your crops closely and consider preventive measures."
            )
        else:
            base_explanation = (
                f"High fungal disease risk for your {crop_type} crop. "
                f"Current weather conditions create a favorable environment "
                f"for fungal pathogen growth. Immediate attention recommended."
            )

        # Add key factors explanation if rules were triggered
        if triggered_rules:
            factors_explanation = " Key risk factors: " + "; ".join(
                [desc for desc, _ in triggered_rules[:3]]
            )
            if len(triggered_rules) > 3:
                factors_explanation += "..."
            return base_explanation + factors_explanation + "."

        return base_explanation + " No significant risk factors identified."

    @staticmethod
    def save_assessment(
        db: Session,
        farm_id: str,
        weather_log_id: Optional[str],
        disease_name: str,
        risk_score: float,
        risk_level: str,
        triggered_rules_json: Dict[str, Any],
        explanation_text: str,
    ) -> DiseaseRiskAssessment:
        """Save disease risk assessment to database."""
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

        db_assessment = DiseaseRiskAssessment(
            farm_id=farm_uuid,
            weather_log_id=weather_log_uuid,
            disease_name=disease_name,
            risk_score=risk_score,
            risk_level=risk_level,
            triggered_rules_json=triggered_rules_json,
            explanation_text=explanation_text,
        )
        db.add(db_assessment)
        db.commit()
        db.refresh(db_assessment)
        return db_assessment

    @staticmethod
    def get_disease_history(
        db: Session, farm_id: str, limit: int = 100
    ) -> List[DiseaseRiskAssessment]:
        """Get disease risk assessment history for a farm."""
        try:
            farm_uuid = uuid.UUID(farm_id)
        except (ValueError, AttributeError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid farm ID format",
            )
        return (
            db.query(DiseaseRiskAssessment)
            .filter(DiseaseRiskAssessment.farm_id == farm_uuid)
            .order_by(DiseaseRiskAssessment.created_at.desc())
            .limit(limit)
            .all()
        )
