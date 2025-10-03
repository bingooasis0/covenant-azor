# app/audit_helper.py
from sqlalchemy.orm import Session
from sqlalchemy import text
import json

def write_audit(db: Session, actor_user_id: str, action: str, entity_type: str, entity_id: str | None, metadata: dict | None = None):
    try:
        if metadata:
            db.execute(text("INSERT INTO audit_event (actor_user_id, action, entity_type, entity_id, metadata) VALUES (:u, :a, :t, :i, CAST(:m AS JSONB))"),
                       {"u": actor_user_id, "a": action, "t": entity_type, "i": entity_id, "m": json.dumps(metadata)})
        else:
            db.execute(text("INSERT INTO audit_event (actor_user_id, action, entity_type, entity_id) VALUES (:u, :a, :t, :i)"),
                       {"u": actor_user_id, "a": action, "t": entity_type, "i": entity_id})
        db.commit()
    except Exception:
        # Do not break business flow on audit failure
        try: db.rollback()
        except: pass
