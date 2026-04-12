from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import requests
import uuid
from app.models.weather import WeatherLog
from app.models.farm import Farm
from app.core.config import settings
from fastapi import HTTPException, status


class WeatherService:
    """Service for weather operations."""

    WEATHER_SOURCE = "openweathermap"

    @staticmethod
    def fetch_weather_from_api(lat: float, lon: float) -> dict:
        """Fetch weather data from OpenWeatherMap API."""
        if not settings.openweather_api_key:
            raise HTTPException(
                status_code=500,
                detail="OpenWeatherMap API key not configured",
            )

        url = (
            "https://api.openweathermap.org/data/2.5/weather"
            f"?lat={lat}&lon={lon}&appid={settings.openweather_api_key}&units=metric"
        )

        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            raise HTTPException(
                status_code=503,
                detail=f"Failed to fetch weather data: {str(e)}",
            )

    @staticmethod
    def parse_weather_data(raw_data: dict) -> dict:
        """
        Parse weather data from OWM current-weather API response (/data/2.5/weather).

        Provider-supplied values (stored directly as received):
        - temperature_c    OWM: main.temp
        - temp_max_c       OWM: main.temp_max  (city-wide snapshot, not true daily max)
        - temp_min_c       OWM: main.temp_min  (city-wide snapshot, not true daily min)
        - humidity_pct     OWM: main.humidity
        - wind_speed_mps   OWM: wind.speed
        - pressure_hpa     OWM: main.pressure  (used directly in PM, avoids need for elevation_m)
        - rainfall_mm      OWM: rain.1h  (last-hour precipitation)
        - cloud_pct        OWM: clouds.all
        - weather_description OWM: weather[0].description

        Null from current provider (requires upgrade to OWM One Call API):
        - dew_point_c      Not present in /data/2.5/weather free-tier response.
                           Phase 3 PM engine will derive it from humidity when null.
                           Do NOT estimate and store here — keep provider vs. derived separate.

        Note: temp_max_c / temp_min_c from OWM snapshot are useful for Hargreaves
        temperature-range approximation but are NOT true 24-hour extremes.
        Phase 3 may supplement with forecast data for better diurnal range.
        """
        main = raw_data.get("main", {})
        return {
            # Core fields
            "temperature_c": main.get("temp"),
            "temp_max_c": main.get("temp_max"),      # provider-supplied, may be close to temp_c on overcast days
            "temp_min_c": main.get("temp_min"),      # provider-supplied
            "humidity_pct": main.get("humidity"),
            "dew_point_c": None,                     # not in OWM free-tier /data/2.5/weather
            "wind_speed_mps": raw_data.get("wind", {}).get("speed"),
            "pressure_hpa": main.get("pressure"),
            "rainfall_mm": raw_data.get("rain", {}).get("1h", 0),
            "cloud_pct": raw_data.get("clouds", {}).get("all"),
            "weather_description": (raw_data.get("weather") or [{}])[0].get("description"),
        }

    @staticmethod
    def create_weather_log(
        db: Session,
        farm_id: str,
        weather_data: dict,
        raw_data: Optional[dict] = None,
    ) -> WeatherLog:
        """Create a weather log entry."""
        try:
            farm_uuid = uuid.UUID(farm_id)
        except (ValueError, AttributeError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid farm ID format",
            )
        db_weather = WeatherLog(
            farm_id=farm_uuid,
            source=WeatherService.WEATHER_SOURCE,
            observed_at=datetime.utcnow(),
            temperature_c=weather_data.get("temperature_c"),
            temp_max_c=weather_data.get("temp_max_c"),
            temp_min_c=weather_data.get("temp_min_c"),
            humidity_pct=weather_data.get("humidity_pct"),
            dew_point_c=weather_data.get("dew_point_c"),  # NULL for OWM free-tier
            wind_speed_mps=weather_data.get("wind_speed_mps"),
            pressure_hpa=weather_data.get("pressure_hpa"),
            rainfall_mm=weather_data.get("rainfall_mm"),
            cloud_pct=weather_data.get("cloud_pct"),
            weather_description=weather_data.get("weather_description"),
            raw_payload_json=raw_data,
        )
        db.add(db_weather)
        db.commit()
        db.refresh(db_weather)
        return db_weather

    @staticmethod
    def get_farm_weather_history(
        db: Session, farm_id: str, limit: int = 100
    ) -> List[WeatherLog]:
        """Get weather history for a farm."""
        try:
            farm_uuid = uuid.UUID(farm_id)
        except (ValueError, AttributeError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid farm ID format",
            )
        return (
            db.query(WeatherLog)
            .filter(WeatherLog.farm_id == farm_uuid)
            .order_by(WeatherLog.observed_at.desc())
            .limit(limit)
            .all()
        )

    @staticmethod
    def get_latest_weather(db: Session, farm_id: str) -> Optional[WeatherLog]:
        """Get the latest weather log for a farm."""
        try:
            farm_uuid = uuid.UUID(farm_id)
        except (ValueError, AttributeError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid farm ID format",
            )
        return (
            db.query(WeatherLog)
            .filter(WeatherLog.farm_id == farm_uuid)
            .order_by(WeatherLog.observed_at.desc())
            .first()
        )

    @staticmethod
    def fetch_and_log_weather(db: Session, farm: Farm) -> WeatherLog:
        """Fetch weather data for a farm and log it."""
        raw_data = WeatherService.fetch_weather_from_api(farm.latitude, farm.longitude)
        weather_data = WeatherService.parse_weather_data(raw_data)
        return WeatherService.create_weather_log(
            db, str(farm.id), weather_data, raw_data
        )
