from sqlalchemy import Column, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.database import Base


class IrrigationRecommendation(Base):
    __tablename__ = "irrigation_recommendations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farm_id = Column(UUID(as_uuid=True), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    weather_log_id = Column(UUID(as_uuid=True), ForeignKey("weather_logs.id", ondelete="SET NULL"), nullable=True, index=True)
    et0 = Column(Float, nullable=True)  # Reference evapotranspiration (mm/day)
    kc = Column(Float, nullable=True)  # Crop coefficient
    etc = Column(Float, nullable=True)  # Crop evapotranspiration (mm/day)
    effective_rainfall_mm = Column(Float, nullable=True)
    net_irrigation_mm = Column(Float, nullable=True)
    recommendation_text = Column(String, nullable=False)
    assumptions_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    farm = relationship("Farm", back_populates="irrigation_recommendations")
    weather_log = relationship("WeatherLog", back_populates="irrigation_recommendations")
