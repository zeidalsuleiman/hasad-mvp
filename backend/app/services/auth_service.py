from sqlalchemy.orm import Session
from app.models.user import User, UserRole
from app.schemas.user import UserCreate
from app.core.security import (
    get_password_hash, verify_password, create_access_token,
    generate_otp, hash_token,
    generate_backup_codes, hash_backup_codes, verify_backup_code
)
from app.core.config import settings
from app.core.email import send_verification_email, send_password_reset_email
from fastapi import HTTPException, status
from datetime import datetime, timedelta, timezone


def _now() -> datetime:
    """Return current UTC time as timezone-aware (matches TIMESTAMPTZ columns)."""
    return datetime.now(timezone.utc)
import pyotp
import logging

logger = logging.getLogger(__name__)


class AuthService:
    """Service for authentication operations."""

    @staticmethod
    def register_user(db: Session, user_data: UserCreate) -> User:
        """
        Register a new user.
        Generates a 6-digit OTP, stores its hash, and sends a verification email.
        Raises HTTPException if email already registered or email delivery fails.
        """
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

        otp = generate_otp()
        otp_hash = hash_token(otp)
        otp_expires = _now() + timedelta(hours=settings.verification_expire_hours)

        hashed_password = get_password_hash(user_data.password)
        db_user = User(
            full_name=user_data.full_name,
            email=user_data.email,
            password_hash=hashed_password,
            role=UserRole.FARMER,
            is_verified=False,
            activation_token_hash=otp_hash,
            activation_token_expires_at=otp_expires,
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        # Send verification email — raises if SMTP not configured
        try:
            send_verification_email(user_data.email, otp)
        except RuntimeError:
            # SMTP not configured — delete user and surface a clear error
            db.delete(db_user)
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=(
                    "Email delivery is not configured on this server. "
                    "Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM "
                    "in the backend environment and restart."
                ),
            )
        except Exception as e:
            db.delete(db_user)
            db.commit()
            logger.error(f"Failed to send verification email to {user_data.email}: {e}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to send verification email: {e}",
            )

        logger.info(f"User registered, verification OTP sent: {user_data.email}")
        return db_user

    @staticmethod
    def verify_email_otp(db: Session, email: str, otp: str) -> User:
        """Verify a user's email using the 6-digit OTP."""
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid email or verification code",
            )

        if user.is_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Account is already verified",
            )

        otp_hash = hash_token(otp)
        if user.activation_token_hash != otp_hash:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification code",
            )

        if user.activation_token_expires_at and user.activation_token_expires_at < _now():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification code has expired. Please request a new code.",
            )

        user.is_verified = True
        user.email_verified_at = _now()
        user.activation_token_hash = None
        user.activation_token_expires_at = None
        db.commit()
        db.refresh(user)

        logger.info(f"Email verified: {user.email}")
        return user

    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> User:
        """Authenticate a user with email and password."""
        user = db.query(User).filter(User.email == email).first()
        if not user or not verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive",
            )

        if not user.is_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Please verify your email address before logging in",
            )

        return user

    @staticmethod
    def resend_verification(db: Session, email: str) -> None:
        """
        Resend a verification OTP to an unverified user.
        Silent no-op if the email doesn't exist (prevents enumeration).
        Raises HTTPException if the account is already verified.
        """
        user = db.query(User).filter(User.email == email).first()
        if not user:
            logger.info(f"Resend verification requested for unknown email: {email}")
            return

        if user.is_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This account is already verified. Please log in.",
            )

        otp = generate_otp()
        otp_hash = hash_token(otp)
        otp_expires = _now() + timedelta(hours=settings.verification_expire_hours)

        user.activation_token_hash = otp_hash
        user.activation_token_expires_at = otp_expires
        db.commit()

        try:
            send_verification_email(email, otp)
        except Exception as e:
            logger.error(f"Failed to resend verification email to {email}: {e}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to send verification email: {e}",
            )

        logger.info(f"Verification OTP resent: {email}")

    @staticmethod
    def request_password_reset(db: Session, email: str) -> None:
        """
        Send a 6-digit OTP to the user's email for password reset.
        Always returns without error to prevent email enumeration.
        Raises if SMTP is not configured.
        """
        user = db.query(User).filter(User.email == email).first()
        if not user:
            logger.info(f"Password reset requested for non-existent email: {email}")
            return

        otp = generate_otp()
        otp_hash = hash_token(otp)
        otp_expires = _now() + timedelta(hours=settings.password_reset_expire_hours)

        user.password_reset_token_hash = otp_hash
        user.password_reset_token_expires_at = otp_expires
        db.commit()

        send_password_reset_email(email, otp)
        logger.info(f"Password reset OTP sent: {email}")

    @staticmethod
    def confirm_password_reset(db: Session, email: str, otp: str, new_password: str) -> User:
        """Reset a user's password using their email + OTP."""
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid email or reset code",
            )

        otp_hash = hash_token(otp)
        if user.password_reset_token_hash != otp_hash:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid reset code",
            )

        if user.password_reset_token_expires_at and user.password_reset_token_expires_at < _now():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reset code has expired. Please request a new one.",
            )

        user.password_hash = get_password_hash(new_password)
        user.password_reset_token_hash = None
        user.password_reset_token_expires_at = None
        db.commit()
        db.refresh(user)

        logger.info(f"Password reset completed: {user.email}")
        return user

    @staticmethod
    def create_token(user_id: str) -> str:
        """Create a JWT token for a user."""
        return create_access_token(data={"sub": str(user_id)})

    @staticmethod
    def get_user_by_id(db: Session, user_id: str) -> User:
        """Get a user by ID."""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        return user

    @staticmethod
    def setup_2fa(db: Session, user: User) -> tuple[str, str]:
        """Set up 2FA. Returns (provisioning_uri, secret)."""
        totp_secret = pyotp.random_base32()
        totp = pyotp.TOTP(totp_secret, digits=settings.totp_digits, interval=settings.totp_interval)
        provisioning_uri = totp.provisioning_uri(name=user.email, issuer_name=settings.totp_issuer)
        logger.info(f"2FA setup initiated: {user.email}")
        return provisioning_uri, totp_secret

    @staticmethod
    def enable_2fa(db: Session, user: User, totp_secret: str, verification_code: str) -> tuple[User, list[str]]:
        """Enable 2FA after verifying the setup code. Returns (user, backup_codes)."""
        totp = pyotp.TOTP(totp_secret, digits=settings.totp_digits, interval=settings.totp_interval)
        if not totp.verify(verification_code, valid_window=1):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification code")

        backup_codes = generate_backup_codes(settings.backup_codes_count)
        backup_codes_hashed = hash_backup_codes(backup_codes)

        user.totp_secret_hash = hash_token(totp_secret)
        user.two_factor_enabled = True
        user.backup_codes_hash = backup_codes_hashed
        user.backup_codes_updated_at = _now()
        db.commit()
        db.refresh(user)

        logger.info(f"2FA enabled: {user.email}")
        return user, backup_codes

    @staticmethod
    def disable_2fa(db: Session, user: User, password: str) -> User:
        """Disable 2FA. Requires password confirmation."""
        if not verify_password(password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid password")

        user.totp_secret_hash = None
        user.two_factor_enabled = False
        user.backup_codes_hash = None
        user.backup_codes_updated_at = None
        db.commit()
        db.refresh(user)

        logger.info(f"2FA disabled: {user.email}")
        return user

    @staticmethod
    def verify_2fa_code(db: Session, user: User, code: str) -> bool:
        """Verify a TOTP or backup code. Returns True or raises HTTPException."""
        if not user.two_factor_enabled:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="2FA is not enabled")

        totp = pyotp.TOTP(user.totp_secret_hash, digits=settings.totp_digits, interval=settings.totp_interval)
        if totp.verify(code, valid_window=1):
            logger.info(f"2FA TOTP verified: {user.email}")
            return True

        if user.backup_codes_hash:
            is_valid, idx = verify_backup_code(code, user.backup_codes_hash)
            if is_valid:
                user.backup_codes_hash = [c for i, c in enumerate(user.backup_codes_hash) if i != idx]
                db.commit()
                logger.info(f"2FA backup code used: {user.email}")
                return True

        logger.warning(f"2FA verification failed: {user.email}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid verification code")

    @staticmethod
    def get_backup_codes_count(db: Session, user: User) -> int:
        if not user.backup_codes_hash:
            return 0
        return len(user.backup_codes_hash)

    @staticmethod
    def regenerate_backup_codes(db: Session, user: User, password: str) -> list[str]:
        """Regenerate backup codes. Requires password confirmation."""
        if not user.two_factor_enabled:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="2FA is not enabled")
        if not verify_password(password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid password")

        backup_codes = generate_backup_codes(settings.backup_codes_count)
        user.backup_codes_hash = hash_backup_codes(backup_codes)
        user.backup_codes_updated_at = _now()
        db.commit()
        db.refresh(user)

        logger.info(f"Backup codes regenerated: {user.email}")
        return backup_codes
