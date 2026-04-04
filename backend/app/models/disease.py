from sqlalchemy import Column, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.database import Base


class DiseaseRiskAssessment(Base):
    __tablename__ = "disease_risk_assessments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farm_id = Column(UUID(as_uuid=True), ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    weather_log_id = Column(UUID(as_uuid=True), ForeignKey("weather_logs.id", ondelete="SET NULL"), nullable=True, index=True)
    disease_name = Column(String, nullable=False)
    risk_score = Column(Float, nullable=False)  # 0-100 scale
    risk_level = Column(String, nullable=False)  # 'low', 'medium', 'high'
    triggered_rules_json = Column(JSON, nullable=True)
    explanation_text = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    farm = relationship("Farm", back_populates="disease_risk_assessments")
    weather_log = relationship("WeatherLog", back_populates="disease_risk_assessments")
