
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql as psql

revision = '0003_mfa'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        'mfa_credential',
        sa.Column('user_id', psql.UUID(as_uuid=True), sa.ForeignKey('users.id'), primary_key=True),
        sa.Column('secret', sa.String(), nullable=False),
        sa.Column('enabled', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('recovery_codes', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False)
    )

def downgrade():
    op.drop_table('mfa_credential')
