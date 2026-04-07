from datetime import datetime
from pydantic import BaseModel, EmailStr, field_validator
from uuid import UUID


def _validate_password_strength(v: str) -> str:
    if len(v) < 8:
        raise ValueError('Password must be at least 8 characters long')
    if not any(c.isupper() for c in v):
        raise ValueError('Password must contain at least one uppercase letter')
    if not any(c.islower() for c in v):
        raise ValueError('Password must contain at least one lowercase letter')
    if not any(c.isdigit() for c in v):
        raise ValueError('Password must contain at least one number')
    special_chars = "!@#$%^&*()_+-=[]{}|;:,.<>/?"
    if not any(c in special_chars for c in v):
        raise ValueError('Password must contain at least one special character')
    return v


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str

    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        return _validate_password_strength(v)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: UUID
    full_name: str
    email: str
    role: str
    is_active: bool
    is_verified: bool
    two_factor_enabled: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    requires_2fa: bool = False


# Registration now always requires email verification
class RegisterResponse(BaseModel):
    requires_verification: bool = True
    email: str
    message: str = "Verification code sent to your email"


class VerifyEmailRequest(BaseModel):
    email: EmailStr
    code: str


class VerifyEmailResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetRequestResponse(BaseModel):
    message: str = "If your email is registered, you will receive a reset code"


class PasswordResetConfirm(BaseModel):
    email: EmailStr
    code: str
    new_password: str

    @field_validator('new_password')
    @classmethod
    def validate_password(cls, v):
        return _validate_password_strength(v)


class PasswordResetConfirmResponse(BaseModel):
    message: str = "Password reset successfully"


class TwoFactorSetupResponse(BaseModel):
    provisioning_uri: str
    secret: str
    message: str = "Scan the QR code with your authenticator app"


class TwoFactorEnable(BaseModel):
    totp_secret: str
    verification_code: str


class TwoFactorEnableResponse(BaseModel):
    message: str = "Two-factor authentication enabled successfully"
    backup_codes: list[str]


class TwoFactorDisable(BaseModel):
    password: str


class TwoFactorDisableResponse(BaseModel):
    message: str = "Two-factor authentication disabled successfully"


class TwoFactorVerify(BaseModel):
    code: str


class TwoFactorVerifyResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TwoFactorStatusResponse(BaseModel):
    two_factor_enabled: bool
    backup_codes_remaining: int


class RegenerateBackupCodesResponse(BaseModel):
    message: str = "Backup codes regenerated successfully"
    backup_codes: list[str]


class RegenerateBackupCodesRequest(BaseModel):
    password: str


class LoginWith2FARequest(BaseModel):
    email: EmailStr
    password: str
    totp_code: str | None = None
    backup_code: str | None = None
