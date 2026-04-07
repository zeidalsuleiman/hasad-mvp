"""Authentication hardening
Add account activation, password reset, and 2FA support.

Revision ID: 004
Revises: 003
Create Date: 2026-04-06
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Account activation columns
    op.add_column('users', sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('users', sa.Column('email_verified_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('activation_token_hash', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('activation_token_expires_at', sa.DateTime(timezone=True), nullable=True))

    # Password reset columns
    op.add_column('users', sa.Column('password_reset_token_hash', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('password_reset_token_expires_at', sa.DateTime(timezone=True), nullable=True))

    # 2FA columns
    op.add_column('users', sa.Column('totp_secret_hash', sa.String(length=255), nullable=True))
    op.add_column('users', sa.Column('two_factor_enabled', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('users', sa.Column('backup_codes_hash', postgresql.JSONB(), nullable=True))
    op.add_column('users', sa.Column('backup_codes_updated_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    # 2FA columns
    op.drop_column('users', 'backup_codes_updated_at')
    op.drop_column('users', 'backup_codes_hash')
    op.drop_column('users', 'two_factor_enabled')
    op.drop_column('users', 'totp_secret_hash')

    # Password reset columns
    op.drop_column('users', 'password_reset_token_expires_at')
    op.drop_column('users', 'password_reset_token_hash')

    # Account activation columns
    op.drop_column('users', 'activation_token_expires_at')
    op.drop_column('users', 'activation_token_hash')
    op.drop_column('users', 'email_verified_at')
    op.drop_column('users', 'is_verified')
