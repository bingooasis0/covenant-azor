
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.dependencies import get_db, require_auth, require_admin

router = APIRouter()

@router.get("/audit/events")
def list_audit_events(
    auth = Depends(require_auth),
    db: Session = Depends(get_db),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
    p: Optional[int] = Query(None, description="Optional page number; offset = p * limit")
):
    """
    Lists audit events (most recent first).
    Fixes previous SQL that referenced a non-existent 'event' column by using 'action'.
    """
    if p is not None:
        offset = max(0, p) * limit

    rows = db.execute(
        text("""
            SELECT ae.created_at,
                   ae.action,
                   ae.entity_type,
                   ae.entity_id,
                   ae.actor_user_id,
                   u.email as actor_email,
                   u.first_name as actor_first_name,
                   u.last_name as actor_last_name
              FROM audit_event ae
              LEFT JOIN users u ON ae.actor_user_id = u.id
             ORDER BY ae.created_at DESC
             LIMIT :lim OFFSET :off
        """),
        {"lim": limit, "off": offset},
    ).mappings().all()

    next_token = None if len(rows) < limit else str(offset + limit)
    return {"items": rows, "next": next_token}
