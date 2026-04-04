"""Add irrigation recommendations table

Revision ID: 002
Revises: 001
Create Date: 2026-04-03

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create irrigation_recommendations table
    op.create_table(
        'irrigation_recommendations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('farm_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('weather_log_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('et0', sa.Float(), nullable=True),
        sa.Column('kc', sa.Float(), nullable=True),
        sa.Column('etc', sa.Float(), nullable=True),
        sa.Column('effective_rainfall_mm', sa.Float(), nullable=True),
        sa.Column('net_irrigation_mm', sa.Float(), nullable=True),
        sa.Column('recommendation_text', sa.String(), nullable=False),
        sa.Column('assumptions_json', postgresql.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
    )

    # Create foreign keys
    op.create_foreign_key(
        'fk_irrigation_recommendations_farm_id',
        'irrigation_recommendations', 'farms',
        ['farm_id'], ['id'],
        ondelete='CASCADE'
    )
    op.create_foreign_key(
        'fk_irrigation_recommendations_weather_log_id',
        'irrigation_recommendations', 'weather_logs',
        ['weather_log_id'], ['id'],
        ondelete='SET NULL'
    )

    # Create indexes
    op.create_index('ix_irrigation_recommendations_farm_id', 'irrigation_recommendations', ['farm_id'])
    op.create_index('ix_irrigation_recommendations_weather_log_id', 'irrigation_recommendations', ['weather_log_id'])


def downgrade() -> None:
    op.drop_index('ix_irrigation_recommendations_weather_log_id', table_name='irrigation_recommendations')
    op.drop_index('ix_irrigation_recommendations_farm_id', table_name='irrigation_recommendations')
    op.drop_table('irrigation_recommendations')
