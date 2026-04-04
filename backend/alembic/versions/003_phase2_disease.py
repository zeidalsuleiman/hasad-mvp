"""Add disease risk assessments table

Revision ID: 003
Revises: 002
Create Date: 2026-04-03

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create disease_risk_assessments table
    op.create_table(
        'disease_risk_assessments',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('farm_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('weather_log_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('disease_name', sa.String(), nullable=False),
        sa.Column('risk_score', sa.Float(), nullable=False),
        sa.Column('risk_level', sa.String(), nullable=False),
        sa.Column('triggered_rules_json', postgresql.JSON(), nullable=True),
        sa.Column('explanation_text', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
    )

    # Create foreign keys
    op.create_foreign_key(
        'fk_disease_risk_assessments_farm_id',
        'disease_risk_assessments', 'farms',
        ['farm_id'], ['id'],
        ondelete='CASCADE'
    )
    op.create_foreign_key(
        'fk_disease_risk_assessments_weather_log_id',
        'disease_risk_assessments', 'weather_logs',
        ['weather_log_id'], ['id'],
        ondelete='SET NULL'
    )

    # Create indexes
    op.create_index('ix_disease_risk_assessments_farm_id', 'disease_risk_assessments', ['farm_id'])
    op.create_index('ix_disease_risk_assessments_weather_log_id', 'disease_risk_assessments', ['weather_log_id'])


def downgrade() -> None:
    op.drop_index('ix_disease_risk_assessments_weather_log_id', table_name='disease_risk_assessments')
    op.drop_index('ix_disease_risk_assessments_farm_id', table_name='disease_risk_assessments')
    op.drop_table('disease_risk_assessments')
