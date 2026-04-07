from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import (
    UserCreate, UserLogin, UserResponse, TokenResponse,
    RegisterResponse, VerifyEmailRequest, VerifyEmailResponse,
    PasswordResetRequest, PasswordResetRequestResponse,
    PasswordResetConfirm, PasswordResetConfirmResponse,
    TwoFactorSetupResponse, TwoFactorEnable, TwoFactorEnableResponse,
    TwoFactorDisable, TwoFactorDisableResponse,
    TwoFactorVerify, TwoFactorVerifyResponse,
    TwoFactorStatusResponse, RegenerateBackupCodesRequest, RegenerateBackupCodesResponse,
    LoginWith2FARequest
)
from app.models.user import User
from app.services.auth_service import AuthService
from app.api.deps import get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user. Sends a 6-digit OTP to the provided email.
    The user must verify via /auth/verify-email before they can log in.
    Returns 503 if SMTP is not configured.
    """
    user = AuthService.register_user(db, user_data)
    return RegisterResponse(email=user.email)


@router.post("/verify-email", response_model=VerifyEmailResponse)
def verify_email(request: VerifyEmailRequest, db: Session = Depends(get_db)):
    """
    Verify a user's email using the 6-digit OTP sent during registration.
    On success returns a JWT token and user data (user is now logged in).
    """
    user = AuthService.verify_email_otp(db, request.email, request.code)
    token = AuthService.create_token(str(user.id))
    return VerifyEmailResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """
    Login with email and password.
    Requires the account to be email-verified.
    If 2FA is enabled, requires_2fa will be True — complete with /login/2fa.
    """
    user = AuthService.authenticate_user(db, login_data.email, login_data.password)
    token = AuthService.create_token(str(user.id))
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
        requires_2fa=user.two_factor_enabled,
    )


@router.post("/login/2fa", response_model=TwoFactorVerifyResponse)
def login_with_2fa(request: LoginWith2FARequest, db: Session = Depends(get_db)):
    """Complete login for users with 2FA enabled."""
    user = AuthService.authenticate_user(db, request.email, request.password)
    if user.two_factor_enabled:
        code = request.totp_code or request.backup_code
        if not code:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="2FA code required")
        AuthService.verify_2fa_code(db, user, code)
    token = AuthService.create_token(str(user.id))
    return TwoFactorVerifyResponse(access_token=token, token_type="bearer")


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.post("/resend-verification")
def resend_verification(request: PasswordResetRequest, db: Session = Depends(get_db)):
    """
    Resend a verification OTP to an unverified account.
    Always returns 200 to prevent email enumeration.
    """
    AuthService.resend_verification(db, request.email)
    return {"message": "If your account exists and is unverified, a new code has been sent"}


@router.post("/forgot-password", response_model=PasswordResetRequestResponse)
def forgot_password(request: PasswordResetRequest, db: Session = Depends(get_db)):
    """
    Send a 6-digit OTP to the user's email for password reset.
    Always returns 200 to prevent email enumeration.
    Returns 503 if SMTP is not configured.
    """
    AuthService.request_password_reset(db, request.email)
    return PasswordResetRequestResponse()


@router.post("/reset-password", response_model=PasswordResetConfirmResponse)
def reset_password(request: PasswordResetConfirm, db: Session = Depends(get_db)):
    """Reset password using email + 6-digit OTP + new password."""
    AuthService.confirm_password_reset(db, request.email, request.code, request.new_password)
    return PasswordResetConfirmResponse()


# ── 2FA Endpoints ─────────────────────────────────────────────────────────────

@router.get("/2fa/status", response_model=TwoFactorStatusResponse)
def get_2fa_status(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return TwoFactorStatusResponse(
        two_factor_enabled=current_user.two_factor_enabled,
        backup_codes_remaining=AuthService.get_backup_codes_count(db, current_user),
    )


@router.post("/2fa/setup", response_model=TwoFactorSetupResponse)
def setup_2fa(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.two_factor_enabled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="2FA is already enabled")
    provisioning_uri, secret = AuthService.setup_2fa(db, current_user)
    return TwoFactorSetupResponse(provisioning_uri=provisioning_uri, secret=secret)


@router.post("/2fa/enable", response_model=TwoFactorEnableResponse)
def enable_2fa(
    request: TwoFactorEnable,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.two_factor_enabled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="2FA is already enabled")
    _, backup_codes = AuthService.enable_2fa(db, current_user, request.totp_secret, request.verification_code)
    return TwoFactorEnableResponse(backup_codes=backup_codes)


@router.post("/2fa/disable", response_model=TwoFactorDisableResponse)
def disable_2fa(
    request: TwoFactorDisable,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.two_factor_enabled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="2FA is not enabled")
    AuthService.disable_2fa(db, current_user, request.password)
    return TwoFactorDisableResponse()


@router.post("/2fa/verify", response_model=TwoFactorVerifyResponse)
def verify_2fa(
    request: TwoFactorVerify,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    AuthService.verify_2fa_code(db, current_user, request.code)
    token = AuthService.create_token(str(current_user.id))
    return TwoFactorVerifyResponse(access_token=token, token_type="bearer")


@router.post("/2fa/regenerate-backup-codes", response_model=RegenerateBackupCodesResponse)
def regenerate_backup_codes(
    request: RegenerateBackupCodesRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    backup_codes = AuthService.regenerate_backup_codes(db, current_user, request.password)
    return RegenerateBackupCodesResponse(backup_codes=backup_codes)
