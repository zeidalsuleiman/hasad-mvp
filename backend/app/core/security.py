from datetime import datetime, timedelta
from typing import Optional
from jose import jwt
import bcrypt
import secrets
import hashlib
from app.core.config import settings


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password."""
    try:
        return bcrypt.checkpw(
            plain_password.encode('utf-8'),
            hashed_password.encode('utf-8')
        )
    except (ValueError, TypeError):
        return False


def get_password_hash(password: str) -> str:
    """Hash a password."""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.jwt_expire_minutes)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm
    )
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """Decode and verify a JWT access token."""
    try:
        payload = jwt.decode(
            token, settings.jwt_secret, algorithms=[settings.jwt_algorithm]
        )
        return payload
    except jwt.JWTError:
        return None


def generate_secure_token() -> str:
    """Generate a cryptographically secure random token (32 bytes -> 64 hex chars)."""
    return secrets.token_hex(32)


def generate_otp(digits: int = 6) -> str:
    """Generate a numeric OTP (e.g. '048291')."""
    return str(secrets.randbelow(10 ** digits)).zfill(digits)


def hash_token(token: str) -> str:
    """Hash a token using SHA-256 for secure storage."""
    return hashlib.sha256(token.encode()).hexdigest()


def verify_token_hash(token: str, hashed_token: str) -> bool:
    """Verify a token against its hash."""
    return hash_token(token) == hashed_token


def generate_backup_codes(count: int = 10) -> list[str]:
    """Generate one-time backup codes for 2FA recovery."""
    codes = []
    for _ in range(count):
        # Generate 8-character alphanumeric codes (uppercase only)
        code = ''.join(secrets.choice('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ') for _ in range(8))
        # Format as XXXX-XXXX for readability
        codes.append(f"{code[:4]}-{code[4:]}")
    return codes


def hash_backup_codes(codes: list[str]) -> list[str]:
    """Hash backup codes for storage."""
    return [hash_token(code) for code in codes]


def verify_backup_code(provided_code: str, hashed_codes: list[str]) -> tuple[bool, Optional[int]]:
    """
    Verify a backup code against stored hashed codes.
    Returns (is_valid, index_of_code) or (False, None).
    """
    provided_hash = hash_token(provided_code)
    for idx, stored_hash in enumerate(hashed_codes):
        if provided_hash == stored_hash:
            return True, idx
    return False, None
