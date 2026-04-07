from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    app_name: str = "HASAD"
    app_version: str = "1.0.0"
    debug: bool = False

    # Database
    database_url: str = "postgresql+psycopg2://hasad:hasad_password@db:5432/hasad"

    # Security
    jwt_secret: str = "dev-secret-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24  # 24 hours

    # Email verification OTP
    verification_expire_hours: int = 24

    # Password reset OTP
    password_reset_expire_hours: int = 1

    # 2FA
    totp_issuer: str = "HASAD"
    totp_digits: int = 6
    totp_interval: int = 30
    backup_codes_count: int = 10

    # Email (SMTP) — all optional; if smtp_host is unset, sending raises an error
    smtp_host: Optional[str] = None
    smtp_port: int = 587
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_from: str = "noreply@hasad.app"
    smtp_tls: bool = True

    # External APIs
    openweather_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
