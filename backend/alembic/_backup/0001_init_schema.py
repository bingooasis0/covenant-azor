from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql as psql

# revision identifiers, used by Alembic.
revision = "0001"
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        "users",
        sa.Column("id", psql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("email", sa.String(), nullable=False, unique=True),
        sa.Column("first_name", sa.String(), nullable=False),
        sa.Column("last_name", sa.String(), nullable=False),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("TRUE")),
        sa.Column("role", sa.String(), nullable=False, server_default=sa.text("'AGENT'")),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
    )

    op.create_table(
        "referrals",
        sa.Column("id", psql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("ref_no", sa.String(), unique=True),
        sa.Column("company", sa.String(), nullable=False),
        sa.Column("contact_name", sa.String()),
        sa.Column("contact_email", sa.String()),
        sa.Column("contact_phone", sa.String()),
        sa.Column("notes", sa.Text()),
        sa.Column("status", sa.String(), nullable=False, server_default=sa.text("'New'")),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("agent_id", psql.UUID(as_uuid=True), sa.ForeignKey("users.id")),
    )

def downgrade():
    op.drop_table("referrals")
    op.drop_table("users")
