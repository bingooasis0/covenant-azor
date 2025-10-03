from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.dependencies import get_db, require_auth
from app import models

router = APIRouter()

@router.get("/me")
def read_me(auth=Depends(require_auth), db: Session = Depends(get_db)):
    sub, role = auth  # require_auth returns (user_id, role)

    # Get user with MFA status
    row = db.execute(
        text("""
            SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.created_at,
                   COALESCE(mfa.enabled, FALSE) as mfa_enabled
            FROM users u
            LEFT JOIN mfa_credential mfa ON u.id = mfa.user_id
            WHERE u.id = :user_id
            LIMIT 1
        """),
        {"user_id": sub}
    ).mappings().first()

    if not row:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": str(row["id"]),
        "email": row["email"],
        "first_name": row["first_name"] or "",
        "last_name": row["last_name"] or "",
        "role": row["role"],
        "created_at": row["created_at"],
        "mfa_enabled": bool(row["mfa_enabled"]),
    }
