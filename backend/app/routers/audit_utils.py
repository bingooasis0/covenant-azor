# backend/app/routers/audit_utils.py
from sqlalchemy.orm import Session
from sqlalchemy import text

def log_event(db: Session, action: str, entity_type: str | None = None, entity_id: str | None = None, actor_user_id: str | None = None):
    try:
        db.execute(
            text("INSERT INTO audit_event (actor_user_id, action, entity_type, entity_id) VALUES (:a,:b,:c,:d)"),
            {"a": actor_user_id, "b": action, "c": entity_type, "d": entity_id},
        )
        db.commit()
    except Exception:
        db.rollback()
