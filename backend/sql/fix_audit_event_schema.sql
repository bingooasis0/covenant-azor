-- Fix audit_event table schema to match backend code expectations
-- Rename user_id to actor_user_id
ALTER TABLE audit_event RENAME COLUMN user_id TO actor_user_id;

-- Rename entity to entity_type
ALTER TABLE audit_event RENAME COLUMN entity TO entity_type;

-- Recreate index with new column name
DROP INDEX IF EXISTS ix_audit_event_user_id;
CREATE INDEX ix_audit_event_actor_user_id ON audit_event(actor_user_id);
