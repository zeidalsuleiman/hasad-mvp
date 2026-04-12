"""Add Penman-Monteith weather fields to weather_logs

Revision ID: 006
Revises: 005
Create Date: 2026-04-10

Adds three nullable columns to weather_logs in preparation for the full
FAO-56 Penman-Monteith ET₀ implementation (Phase 3).

  temp_max_c   — daily maximum temperature (°C)
                 Populated from OWM main.temp_max (snapshot value, not
                 true 24-hour extreme). Null on pre-migration rows.

  temp_min_c   — daily minimum temperature (°C)
                 Populated from OWM main.temp_min.
                 Null on pre-migration rows.

  dew_point_c  — dew-point temperature (°C)
                 NOT available from OWM free-tier /data/2.5/weather.
                 Stays null until provider is upgraded to One Call API 3.0.
                 Phase 3 PM engine will derive from humidity when null.

elevation_m is NOT added here. OWM already provides pressure_hpa as a
measured value, making elevation-based pressure estimation redundant for
the PM formula.
"""
from alembic import op
import sqlalchemy as sa

revision = '006'
down_revision = '005'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'weather_logs',
        sa.Column('temp_max_c', sa.Float(), nullable=True),
    )
    op.add_column(
        'weather_logs',
        sa.Column('temp_min_c', sa.Float(), nullable=True),
    )
    op.add_column(
        'weather_logs',
        sa.Column('dew_point_c', sa.Float(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column('weather_logs', 'dew_point_c')
    op.drop_column('weather_logs', 'temp_min_c')
    op.drop_column('weather_logs', 'temp_max_c')
