from sqlalchemy import Column, String, Float, DateTime, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.database import Base


class WeatherLog(Base):
    __tablename__ = "weather_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farm_id = Column(UUID(as_uuid=True), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    source = Column(String, nullable=False)
    observed_at = Column(DateTime, nullable=False)
    temperature_c = Column(Float, nullable=True)        # OWM: main.temp
    temp_max_c = Column(Float, nullable=True)           # OWM: main.temp_max  [added Phase 2 for PM]
    temp_min_c = Column(Float, nullable=True)           # OWM: main.temp_min  [added Phase 2 for PM]
    humidity_pct = Column(Float, nullable=True)         # OWM: main.humidity
    dew_point_c = Column(Float, nullable=True)          # Not in OWM free-tier current-weather; NULL until One Call API [added Phase 2 for PM]
    wind_speed_mps = Column(Float, nullable=True)       # OWM: wind.speed
    pressure_hpa = Column(Float, nullable=True)         # OWM: main.pressure  (used in PM as direct measurement, replaces elevation_m estimate)
    rainfall_mm = Column(Float, nullable=True)          # OWM: rain.1h
    cloud_pct = Column(Float, nullable=True)            # OWM: clouds.all
    weather_description = Column(String, nullable=True)
    raw_payload_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    farm = relationship("Farm", back_populates="weather_logs")
    irrigation_recommendations = relationship("IrrigationRecommendation", back_populates="weather_log", cascade="all, delete-orphan")
    disease_risk_assessments = relationship("DiseaseRiskAssessment", back_populates="weather_log", cascade="all, delete-orphan")
