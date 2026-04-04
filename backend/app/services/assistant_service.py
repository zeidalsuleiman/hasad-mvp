from sqlalchemy.orm import Session
from typing import Dict, Any, Optional, Tuple
from datetime import datetime
import logging
from app.models.farm import Farm
from app.models.weather import WeatherLog
from app.models.irrigation import IrrigationRecommendation
from app.models.disease import DiseaseRiskAssessment
from app.models.crop import FarmCrop
from app.services.farm_service import FarmService
from app.services.weather_service import WeatherService
from app.services.irrigation_service import IrrigationService
from app.services.disease_service import DiseaseService
from fastapi import HTTPException, status
import uuid
from app.core.llm import LLMProvider

logger = logging.getLogger(__name__)


class AssistantService:
    """Service for agricultural AI assistant.

    Provides grounded answers using farm, weather, irrigation, and disease data.
    Phase 3 MVP: Stateless, no session persistence.
    """

    # System prompt with strict anti-hallucination instructions
    SYSTEM_PROMPT = """
You are HASAD, an agricultural AI assistant for Jordanian farmers.

CONTEXT:
{context}

INSTRUCTIONS:
1. Use ONLY the data provided in the CONTEXT section above.
2. If CONTEXT has "Available: false", state that clearly.
3. Reference specific farm details: farm name, crop type, soil type.
4. Cite which data sources you used: WEATHER, IRRIGATION, DISEASE RISK.
5. Do NOT give generic agricultural advice unrelated to this farm's situation.

YOU ARE FORBIDDEN FROM:
- Hallucinating any data not in CONTEXT
- Making numerical assumptions without source
- Giving advice about crops not listed under FARM
- Extrapolating weather or disease risk if marked "Available: false"
"""

    @staticmethod
    def build_context(
        farm: Farm,
        crop: Optional[FarmCrop],
        weather: Optional[WeatherLog],
        irrigation: Optional[IrrigationRecommendation],
        disease: Optional[DiseaseRiskAssessment],
    ) -> str:
        """
        Build structured context for LLM prompt.

        Returns formatted string with farm, weather, irrigation, disease sections.
        """
        context_parts = []

        # Farm section
        context_parts.append("FARM:")
        context_parts.append(f"  Name: {farm.name}")
        context_parts.append(f"  Soil Type: {farm.soil_type}")
        context_parts.append(f"  Irrigation Method: {farm.irrigation_method or 'Not specified'}")

        if crop:
            context_parts.append(f"  Crop Type: {crop.crop_type}")
            context_parts.append(f"  Crop Stage: {crop.crop_stage}")
        else:
            context_parts.append("  Crop: No active crop configured")

        # Weather section
        if weather:
            context_parts.append("WEATHER:")
            temp_c = weather.temperature_c or "N/A"
            humidity_pct = weather.humidity_pct or "N/A"
            observed_at = weather.observed_at.strftime("%Y-%m-%d %H:%M") if weather.observed_at else "N/A"
            context_parts.append(f"  Temperature: {temp_c}°C")
            context_parts.append(f"  Humidity: {humidity_pct}%")
            context_parts.append(f"  Observed: {observed_at}")
        else:
            context_parts.append("WEATHER:")
            context_parts.append("  Available: false")
            context_parts.append("  Message: No weather data available")

        # Irrigation section
        if irrigation:
            context_parts.append("IRRIGATION:")
            net_irrigation = irrigation.net_irrigation_mm or 0
            context_parts.append(f"  Net Irrigation: {net_irrigation:.1f} mm/day")
            context_parts.append(f"  Recommendation: {irrigation.recommendation_text}")
        else:
            context_parts.append("IRRIGATION:")
            context_parts.append("  Available: false")
            context_parts.append("  Message: No irrigation recommendation calculated yet")

        # Disease risk section
        if disease:
            context_parts.append("DISEASE RISK:")
            risk_score = disease.risk_score or 0
            context_parts.append(f"  Risk Level: {disease.risk_level}")
            context_parts.append(f"  Risk Score: {risk_score:.0f}/100")
            context_parts.append(f"  Disease: {disease.disease_name}")
        else:
            context_parts.append("DISEASE RISK:")
            context_parts.append("  Available: false")
            context_parts.append("  Message: No disease risk assessment calculated yet")

        return "\n".join(context_parts)

    @staticmethod
    def calculate_confidence(
        weather_available: bool,
        irrigation_available: bool,
        disease_available: bool,
    ) -> str:
        """
        Calculate confidence level based on data availability.

        high: All 3 data sources available
        medium: 2 data sources available
        low: 1 data source available
        low: No data sources available (edge case)
        """
        available_count = sum([weather_available, irrigation_available, disease_available])

        if available_count >= 3:
            return "high"
        elif available_count >= 2:
            return "medium"
        elif available_count >= 1:
            return "low"
        else:
            return "low"  # No data available

    @staticmethod
    def build_data_references(
        farm: Farm,
        crop: Optional[FarmCrop],
        weather: Optional[WeatherLog],
        irrigation: Optional[IrrigationRecommendation],
        disease: Optional[DiseaseRiskAssessment],
    ) -> Dict[str, Any]:
        """
        Build structured data references for response.

        Returns dict with farm, weather, irrigation, disease_risk keys.
        Each key contains available data with source attribution.
        """
        references = {}

        # Farm reference
        references["farm"] = {
            "name": farm.name,
            "soil_type": farm.soil_type,
            "irrigation_method": farm.irrigation_method,
            "source": "farms",
        }

        # Crop reference
        if crop:
            references["crop"] = {
                "crop_type": crop.crop_type,
                "crop_stage": crop.crop_stage,
                "source": "farm_crops",
            }

        # Weather reference
        if weather:
            references["weather"] = {
                "temperature_c": weather.temperature_c,
                "humidity_pct": weather.humidity_pct,
                "observed_at": weather.observed_at.isoformat() if weather.observed_at else None,
                "source": "weather_logs",
            }
        else:
            references["weather"] = {
                "available": False,
                "message": "No weather data available",
            }

        # Irrigation reference
        if irrigation:
            references["irrigation"] = {
                "et0": irrigation.et0,
                "kc": irrigation.kc,
                "net_irrigation_mm": irrigation.net_irrigation_mm,
                "recommendation_text": irrigation.recommendation_text,
                "source": "irrigation_recommendations",
            }
        else:
            references["irrigation"] = {
                "available": False,
                "message": "No irrigation recommendation calculated yet",
            }

        # Disease risk reference
        if disease:
            references["disease_risk"] = {
                "risk_level": disease.risk_level,
                "risk_score": disease.risk_score,
                "disease_name": disease.disease_name,
                "source": "disease_risk_assessments",
            }
        else:
            references["disease_risk"] = {
                "available": False,
                "message": "No disease risk assessment calculated yet",
            }

        return references

    @staticmethod
    def determine_sources(data_references: Dict[str, Any]) -> list[str]:
        """
        Determine which data sources were used in generating response.
        """
        sources = []
        if "weather" in data_references:
            sources.append("weather")
        if "irrigation" in data_references:
            sources.append("irrigation")
        if "disease_risk" in data_references:
            sources.append("disease_risk")
        return sources

    @staticmethod
    def get_farm_context(db: Session, farm_id: str) -> Tuple[Farm, Optional[FarmCrop]]:
        """Get farm and crop context."""
        try:
            farm_uuid = uuid.UUID(farm_id)
        except (ValueError, AttributeError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid farm ID format",
            )

        farm = FarmService.get_farm_by_id(db, farm_id)
        crop = FarmService.get_farm_crop(db, farm_id)
        return farm, crop

    @staticmethod
    def get_weather_context(db: Session, farm_id: str) -> Optional[WeatherLog]:
        """Get latest weather context."""
        return WeatherService.get_latest_weather(db, farm_id)

    @staticmethod
    def get_irrigation_context(db: Session, farm_id: str) -> Optional[IrrigationRecommendation]:
        """Get latest irrigation recommendation context."""
        try:
            recommendations = IrrigationService.get_irrigation_history(db, farm_id, limit=1)
        except HTTPException:
            return None
        return recommendations[0] if recommendations else None

    @staticmethod
    def get_disease_context(db: Session, farm_id: str) -> Optional[DiseaseRiskAssessment]:
        """Get latest disease risk assessment context."""
        try:
            assessments = DiseaseService.get_disease_history(db, farm_id, limit=1)
        except HTTPException:
            return None
        return assessments[0] if assessments else None

    @staticmethod
    def process_chat_request(
        db: Session,
        farm_id: str,
        user_question: str,
    ) -> Tuple[str, list[str], Dict[str, Any], str, int]:
        """
        Process a chat request and return response, sources, data references, confidence.
        """
        logger.info(f"Chat request received: farm_id={farm_id}, question={user_question[:50]}...")

        # Get all context data
        farm, crop = AssistantService.get_farm_context(db, farm_id)
        weather = AssistantService.get_weather_context(db, farm_id)
        irrigation = AssistantService.get_irrigation_context(db, farm_id)
        disease = AssistantService.get_disease_context(db, farm_id)

        # Build structured context
        context = AssistantService.build_context(farm, crop, weather, irrigation, disease)

        # Build data references
        data_references = AssistantService.build_data_references(farm, crop, weather, irrigation, disease)

        # Determine sources used
        sources = AssistantService.determine_sources(data_references)

        # Calculate confidence
        weather_available = weather is not None
        irrigation_available = irrigation is not None
        disease_available = disease is not None
        confidence = AssistantService.calculate_confidence(
            weather_available, irrigation_available, disease_available
        )

        # Call LLM with structured prompt
        system_prompt = AssistantService.SYSTEM_PROMPT.format(context=context)

        try:
            logger.info("Calling LLM API for response generation")
            response_text, tokens_used = LLMProvider.complete(
                system_prompt=system_prompt,
                user_message=user_question,
                max_tokens=1000,
            )
            logger.info(f"LLM response generated: tokens_used={tokens_used}")
        except Exception as e:
            logger.error(f"LLM request failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI service unavailable",
            )

        return response_text, sources, data_references, confidence, tokens_used
