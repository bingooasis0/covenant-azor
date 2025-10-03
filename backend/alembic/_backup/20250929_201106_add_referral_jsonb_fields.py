"""
add referral JSONB fields and indexes

Revision ID: 20250929_201106_add_referral_jsonb_fields
Revises: 
Create Date: 2025-09-29 20:11:06 UTC
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "20250929_201106_add_referral_jsonb_fields"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # New columns on referrals
    op.add_column('referrals', sa.Column('opportunity_types', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('referrals', sa.Column('locations', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('referrals', sa.Column('environment', postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column('referrals', sa.Column('reason', sa.Text(), nullable=True))

    # Indexes
    op.create_index('ix_referrals_agent_id', 'referrals', ['agent_id'], unique=False)
    op.create_index('ix_referrals_created_at', 'referrals', ['created_at'], unique=False)
    op.create_index('ix_referrals_status', 'referrals', ['status'], unique=False)


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_referrals_status', table_name='referrals')
    op.drop_index('ix_referrals_created_at', table_name='referrals')
    op.drop_index('ix_referrals_agent_id', table_name='referrals')

    # Drop columns
    op.drop_column('referrals', 'reason')
    op.drop_column('referrals', 'environment')
    op.drop_column('referrals', 'locations')
    op.drop_column('referrals', 'opportunity_types')
