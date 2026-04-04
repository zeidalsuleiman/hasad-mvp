"""Initial schema

Revision ID: 001
Revises:
Create Date: 2026-04-03

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('full_name', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('password_hash', sa.String(), nullable=False),
        sa.Column('role', sa.String(), nullable=False, server_default='farmer'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)

    # Create farms table
    op.create_table(
        'farms',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column('area_dunum', sa.Float(), nullable=True),
        sa.Column('soil_type', sa.String(), nullable=False),
        sa.Column('irrigation_method', sa.String(), nullable=True),
        sa.Column('notes', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
    )
    op.create_index('ix_farms_user_id', 'farms', ['user_id'])

    # Create farm_crops table
    op.create_table(
        'farm_crops',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('farm_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('crop_type', sa.String(), nullable=False),
        sa.Column('crop_stage', sa.String(), nullable=False),
        sa.Column('planting_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('root_depth_m', sa.Float(), nullable=True),
        sa.Column('kc_value_override', sa.Float(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
    )
    op.create_index('ix_farm_crops_farm_id', 'farm_crops', ['farm_id'])

    # Create weather_logs table
    op.create_table(
        'weather_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('farm_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('source', sa.String(), nullable=False),
        sa.Column('observed_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('temperature_c', sa.Float(), nullable=True),
        sa.Column('humidity_pct', sa.Float(), nullable=True),
        sa.Column('wind_speed_mps', sa.Float(), nullable=True),
        sa.Column('pressure_hpa', sa.Float(), nullable=True),
        sa.Column('rainfall_mm', sa.Float(), nullable=True),
        sa.Column('cloud_pct', sa.Float(), nullable=True),
        sa.Column('weather_description', sa.String(), nullable=True),
        sa.Column('raw_payload_json', postgresql.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
    )
    op.create_index('ix_weather_logs_farm_id', 'weather_logs', ['farm_id'])


def downgrade() -> None:
    op.drop_index('ix_weather_logs_farm_id', table_name='weather_logs')
    op.drop_table('weather_logs')
    op.drop_index('ix_farm_crops_farm_id', table_name='farm_crops')
    op.drop_table('farm_crops')
    op.drop_index('ix_farms_user_id', table_name='farms')
    op.drop_table('farms')
    op.drop_index('ix_users_email', table_name='users')
    op.drop_table('users')
