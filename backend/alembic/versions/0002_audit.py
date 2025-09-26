
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql as psql

revision = '0002_audit'
down_revision = '0001_init'
branch_labels = None
depends_on = None

def upgrade():
    op.execute("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";")
    op.create_table(
        'audit_event',
        sa.Column('id', psql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('actor_user_id', psql.UUID(as_uuid=True), nullable=True),
        sa.Column('action', sa.String(), nullable=False),
        sa.Column('entity_type', sa.String(), nullable=False),
        sa.Column('entity_id', sa.String(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False)
    )

def downgrade():
    op.drop_table('audit_event')
