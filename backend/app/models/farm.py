from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.database import Base


class Farm(Base):
    __tablename__ = "farms"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    area_dunum = Column(Float, nullable=True)
    soil_type = Column(String, nullable=False)
    irrigation_method = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="farms")
    crops = relationship("FarmCrop", back_populates="farm", cascade="all, delete-orphan")
    weather_logs = relationship("WeatherLog", back_populates="farm", cascade="all, delete-orphan")
    irrigation_recommendations = relationship("IrrigationRecommendation", back_populates="farm", cascade="all, delete-orphan")
    disease_risk_assessments = relationship("DiseaseRiskAssessment", back_populates="farm", cascade="all, delete-orphan")
    chat_sessions = relationship("ChatSession", back_populates="farm")
