# backend/alembic/versions/20250926_01_create_audit_event.py
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20250926_01_create_audit_event"
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        "audit_event",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("actor_user_id", sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("action", sa.Text(), nullable=False),
        sa.Column("entity_type", sa.Text(), nullable=False),
        sa.Column("entity_id", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_audit_event_created_at", "audit_event", ["created_at"], unique=False)

def downgrade():
    op.drop_index("ix_audit_event_created_at", table_name="audit_event")
    op.drop_table("audit_event")
