from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt
import os
import requests

router = APIRouter()

JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-me")
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")

security = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    return token

@router.get("/")
def get_weather(lat: float, lon: float, _: str = Depends(verify_token)):
    if not OPENWEATHER_API_KEY:
        raise HTTPException(status_code=500, detail="OPENWEATHER_API_KEY not set")

    url = (
        "https://api.openweathermap.org/data/2.5/weather"
        f"?lat={lat}&lon={lon}&appid={OPENWEATHER_API_KEY}&units=metric"
    )

    r = requests.get(url, timeout=10)
    r.raise_for_status()
    data = r.json()

    # Extract
    temp_c = data.get("main", {}).get("temp")
    feels_like_c = data.get("main", {}).get("feels_like")
    humidity = data.get("main", {}).get("humidity")
    pressure_mb = data.get("main", {}).get("pressure")
    description = (data.get("weather") or [{}])[0].get("description")

    # wind speed: m/s -> km/h
    wind_ms = data.get("wind", {}).get("speed")
    wind_kmh = round(wind_ms * 3.6, 1) if wind_ms is not None else None

    # visibility: meters -> km
    visibility_m = data.get("visibility")
    visibility_km = round(visibility_m / 1000, 1) if visibility_m is not None else None

    return {
        "location": data.get("name"),
        "temperature_c": temp_c,
        "feels_like_c": feels_like_c,
        "humidity": humidity,
        "pressure_mb": pressure_mb,
        "wind_kmh": wind_kmh,
        "visibility_km": visibility_km,
        "weather": description,
    }
