"""Consolidation head: single linear schema for fresh envs and alignment with live

- Ensures pgcrypto extension (for gen_random_uuid)
- users table (with password_hash)
- mfa_credential table (hashed recovery codes JSONB)
- referrals table (JSONB + indexes)
- audit_event table (structured JSON logs of sensitive actions)

This migration is idempotent: it checks existing tables/columns/indexes
and only creates what's missing. Safe to run on live envs.
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql as psql

# Alembic identifiers
revision = "consolidation_20250929"
down_revision = None
branch_labels = None
depends_on = None

def table_exists(bind, name: str) -> bool:
    insp = sa.inspect(bind)
    return name in insp.get_table_names()

def column_exists(bind, table: str, column: str) -> bool:
    insp = sa.inspect(bind)
    cols = [c["name"] for c in insp.get_columns(table)]
    return column in cols

def index_exists(bind, table: str, index: str) -> bool:
    insp = sa.inspect(bind)
    idxs = [i["name"] for i in insp.get_indexes(table)]
    return index in idxs

def fk_exists(bind, table: str, fk_name: str) -> bool:
    insp = sa.inspect(bind)
    fks = [f["name"] for f in insp.get_foreign_keys(table)]
    return fk_name in fks

def create_extension_pgcrypto():
    # Create pgcrypto if not exists (Postgres only)
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto;")

def ensure_users(bind):
    if not table_exists(bind, "users"):
        op.create_table(
            "users",
            sa.Column("id", psql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
            sa.Column("email", sa.Text(), nullable=False, unique=True),
            sa.Column("first_name", sa.Text(), nullable=False, server_default=sa.text("''")),
            sa.Column("last_name", sa.Text(), nullable=False, server_default=sa.text("''")),
            sa.Column("role", sa.Text(), nullable=False, server_default=sa.text("'AZOR'")),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("TRUE")),
            sa.Column("password_hash", sa.Text(), nullable=False),
            sa.Column("created_at", psql.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
            sa.Column("updated_at", psql.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
        )
        op.create_index("ix_users_email", "users", ["email"], unique=True)
    else:
        # Ensure first_name and last_name columns exist
        if not column_exists(bind, "users", "first_name"):
            op.add_column("users", sa.Column("first_name", sa.Text(), nullable=False, server_default=sa.text("''")))
        if not column_exists(bind, "users", "last_name"):
            op.add_column("users", sa.Column("last_name", sa.Text(), nullable=False, server_default=sa.text("''")))
        # Ensure password_hash column exists
        if not column_exists(bind, "users", "password_hash"):
            op.add_column("users", sa.Column("password_hash", sa.Text(), nullable=True))
            # Optional: backfill or enforce NOT NULL later if needed
        # Ensure role
        if not column_exists(bind, "users", "role"):
            op.add_column("users", sa.Column("role", sa.Text(), nullable=False, server_default=sa.text("'AZOR'")))
        # Ensure is_active
        if not column_exists(bind, "users", "is_active"):
            op.add_column("users", sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("TRUE")))
        # Ensure created_at/updated_at
        if not column_exists(bind, "users", "created_at"):
            op.add_column("users", sa.Column("created_at", psql.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")))
        if not column_exists(bind, "users", "updated_at"):
            op.add_column("users", sa.Column("updated_at", psql.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")))
        # Ensure index on email
        if not index_exists(bind, "users", "ix_users_email"):
            op.create_index("ix_users_email", "users", ["email"], unique=True)

def ensure_mfa_credential(bind):
    if not table_exists(bind, "mfa_credential"):
        op.create_table(
            "mfa_credential",
            sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
            sa.Column("user_id", psql.UUID(as_uuid=True), nullable=False),
            sa.Column("secret", sa.Text(), nullable=False),
            sa.Column("verified", sa.Boolean(), nullable=False, server_default=sa.text("FALSE")),
            sa.Column("recovery_codes", psql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'[]'::jsonb")),
            sa.Column("created_at", psql.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
            sa.Column("updated_at", psql.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
        )
        op.create_foreign_key(
            "fk_mfa_credential_user_id_users",
            "mfa_credential",
            "users",
            ["user_id"],
            ["id"],
            ondelete="CASCADE",
        )
        op.create_index("ix_mfa_credential_user_id", "mfa_credential", ["user_id"], unique=True)
    else:
        if not column_exists(bind, "mfa_credential", "recovery_codes"):
            op.add_column("mfa_credential", sa.Column("recovery_codes", psql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'[]'::jsonb")))
        # Ensure FK exists
        if not fk_exists(bind, "mfa_credential", "fk_mfa_credential_user_id_users"):
            op.create_foreign_key(
                "fk_mfa_credential_user_id_users",
                "mfa_credential",
                "users",
                ["user_id"],
                ["id"],
                ondelete="CASCADE",
            )
        if not index_exists(bind, "mfa_credential", "ix_mfa_credential_user_id"):
            op.create_index("ix_mfa_credential_user_id", "mfa_credential", ["user_id"], unique=True)

def ensure_referrals(bind):
    if not table_exists(bind, "referrals"):
        op.create_table(
            "referrals",
            sa.Column("id", psql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
            sa.Column("agent_id", psql.UUID(as_uuid=True), nullable=False),
            sa.Column("status", sa.Text(), nullable=False, server_default=sa.text("'new'")),
            sa.Column("data", psql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
            sa.Column("created_at", psql.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
            sa.Column("updated_at", psql.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
        )
        op.create_index("ix_referrals_agent_id", "referrals", ["agent_id"], unique=False)
        op.create_index("ix_referrals_created_at_desc", "referrals", ["created_at"], unique=False)
        op.create_index("ix_referrals_data_gin", "referrals", [sa.text("data")], unique=False, postgresql_using="gin")
    else:
        # Ensure JSONB index
        if not index_exists(bind, "referrals", "ix_referrals_data_gin"):
            op.create_index("ix_referrals_data_gin", "referrals", [sa.text("data")], unique=False, postgresql_using="gin")
        if not index_exists(bind, "referrals", "ix_referrals_agent_id"):
            op.create_index("ix_referrals_agent_id", "referrals", ["agent_id"], unique=False)
        if not index_exists(bind, "referrals", "ix_referrals_created_at_desc"):
            op.create_index("ix_referrals_created_at_desc", "referrals", ["created_at"], unique=False)
        # Ensure status/data columns exist
        if not column_exists(bind, "referrals", "data"):
            op.add_column("referrals", sa.Column("data", psql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")))
        if not column_exists(bind, "referrals", "status"):
            op.add_column("referrals", sa.Column("status", sa.Text(), nullable=False, server_default=sa.text("'new'")))

def ensure_audit_event(bind):
    if not table_exists(bind, "audit_event"):
        op.create_table(
            "audit_event",
            sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
            sa.Column("actor_user_id", psql.UUID(as_uuid=True), nullable=True),
            sa.Column("action", sa.Text(), nullable=False),
            sa.Column("entity_type", sa.Text(), nullable=True),
            sa.Column("entity_id", psql.UUID(as_uuid=True), nullable=True),
            sa.Column("ip", sa.Text(), nullable=True),
            sa.Column("user_agent", sa.Text(), nullable=True),
            sa.Column("meta", psql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
            sa.Column("created_at", psql.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
        )
        op.create_index("ix_audit_event_created_at", "audit_event", ["created_at"], unique=False)
        op.create_index("ix_audit_event_actor_user_id", "audit_event", ["actor_user_id"], unique=False)
    else:
        # Rename old columns if they exist
        if column_exists(bind, "audit_event", "user_id") and not column_exists(bind, "audit_event", "actor_user_id"):
            op.alter_column("audit_event", "user_id", new_column_name="actor_user_id")
        if column_exists(bind, "audit_event", "entity") and not column_exists(bind, "audit_event", "entity_type"):
            op.alter_column("audit_event", "entity", new_column_name="entity_type")
        # Ensure columns exist
        if not column_exists(bind, "audit_event", "actor_user_id"):
            op.add_column("audit_event", sa.Column("actor_user_id", psql.UUID(as_uuid=True), nullable=True))
        if not column_exists(bind, "audit_event", "entity_type"):
            op.add_column("audit_event", sa.Column("entity_type", sa.Text(), nullable=True))
        if not column_exists(bind, "audit_event", "meta"):
            op.add_column("audit_event", sa.Column("meta", psql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")))
        # Ensure indexes
        if not index_exists(bind, "audit_event", "ix_audit_event_created_at"):
            op.create_index("ix_audit_event_created_at", "audit_event", ["created_at"], unique=False)
        if index_exists(bind, "audit_event", "ix_audit_event_user_id"):
            op.drop_index("ix_audit_event_user_id", table_name="audit_event")
        if not index_exists(bind, "audit_event", "ix_audit_event_actor_user_id"):
            op.create_index("ix_audit_event_actor_user_id", "audit_event", ["actor_user_id"], unique=False)

def upgrade():
    bind = op.get_bind()
    # Ensure Postgres features
    create_extension_pgcrypto()
    # Ensure core tables
    ensure_users(bind)
    ensure_mfa_credential(bind)
    ensure_referrals(bind)
    ensure_audit_event(bind)

def downgrade():
    # Drop in reverse order; use IF EXISTS to be defensive
    op.drop_index("ix_audit_event_user_id", table_name="audit_event", if_exists=True)
    op.drop_index("ix_audit_event_created_at", table_name="audit_event", if_exists=True)
    op.drop_table("audit_event", if_exists=True)

    op.drop_index("ix_referrals_data_gin", table_name="referrals", if_exists=True)
    op.drop_index("ix_referrals_created_at_desc", table_name="referrals", if_exists=True)
    op.drop_index("ix_referrals_agent_id", table_name="referrals", if_exists=True)
    op.drop_table("referrals", if_exists=True)

    op.drop_index("ix_mfa_credential_user_id", table_name="mfa_credential", if_exists=True)
    try:
        op.drop_constraint("fk_mfa_credential_user_id_users", "mfa_credential", type_="foreignkey")
    except Exception:
        pass
    op.drop_table("mfa_credential", if_exists=True)

    op.drop_index("ix_users_email", table_name="users", if_exists=True)
    op.drop_table("users", if_exists=True)
