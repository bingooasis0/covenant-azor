
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from sqlalchemy import text
import secrets, string, random

from app.dependencies import get_db, require_admin

router = APIRouter(prefix="/admin/users", tags=["admin-users"])

class AdminUserCreate(BaseModel):
    email: EmailStr
    role: str = "user"
    first_name: Optional[str] = ""
    last_name: Optional[str] = ""
    password: str

@router.get("")
def admin_list_users(
    admin = Depends(require_admin),
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0)
):
    rows = db.execute(
        text("""
            SELECT id, email, role,
                   COALESCE(first_name,'') AS first_name,
                   COALESCE(last_name,'')  AS last_name,
                   is_active,
                   created_at
              FROM users
             ORDER BY created_at DESC
             LIMIT :lim OFFSET :off
        """),
        {"lim": limit, "off": offset},
    ).mappings().all()
    next_token = None if len(rows) < limit else str(offset + limit)
    return {"items": rows, "next": next_token}

@router.post("", status_code=200)
def admin_create_user(payload: AdminUserCreate, admin=Depends(require_admin), db: Session = Depends(get_db)):
    # Validate password length
    if len(payload.password) < 15:
        raise HTTPException(status_code=422, detail="Password must be at least 15 characters")

    # Hash the password
    import argon2
    ph = argon2.PasswordHasher()
    hashed = ph.hash(payload.password)

    row = db.execute(
        text("""
            INSERT INTO users (email, password_hash, role, first_name, last_name)
            VALUES (:email, :password_hash, :role, :first_name, :last_name)
            ON CONFLICT (email) DO NOTHING
            RETURNING id, email, role, first_name, last_name, created_at
        """),
        {
            "email": payload.email.lower(),
            "password_hash": hashed,
            "role": payload.role,
            "first_name": payload.first_name or "",
            "last_name": payload.last_name or "",
        },
    ).mappings().first()
    if not row:
        raise HTTPException(status_code=409, detail="Email already exists")

    # Send welcome email with credentials
    try:
        from app.notifications.notifier import notify_user_created
        user_name = " ".join(filter(None, [payload.first_name, payload.last_name])) or payload.email
        notify_user_created(payload.email, user_name, payload.password, payload.role)
    except Exception as e:
        print(f"[ADMIN] Failed to send user creation email: {e}")
        # Don't fail the request if email fails

    db.execute(
        text("""INSERT INTO audit_event (actor_user_id, action, entity_type, entity_id)
                VALUES (:uid, 'admin.user.created', 'user', :entity_id)"""),
        {"uid": admin[0], "entity_id": row['id']},
    )
    db.commit()
    return row

@router.delete("/{user_id}", status_code=200)
def admin_delete_user(user_id: str, admin=Depends(require_admin), db: Session = Depends(get_db)):
    deleted = db.execute(text("DELETE FROM users WHERE id = :id"), {"id": user_id}).rowcount
    if not deleted:
        raise HTTPException(status_code=404, detail="User not found")
    db.execute(
        text("""INSERT INTO audit_event (actor_user_id, action, entity_type, entity_id)
                VALUES (:uid, 'admin.user.deleted', 'user', :entity_id)"""),
        {"uid": admin[0], "entity_id": user_id},
    )
    db.commit()
    return {"ok": True}

@router.patch("/{user_id}", status_code=200)
def admin_update_user(user_id: str, payload: dict, admin=Depends(require_admin), db: Session = Depends(get_db)):
    # Build dynamic update based on what fields are provided
    updates = []
    params = {"uid": user_id}

    if "first_name" in payload:
        updates.append("first_name = :first_name")
        params["first_name"] = payload["first_name"]

    if "last_name" in payload:
        updates.append("last_name = :last_name")
        params["last_name"] = payload["last_name"]

    if "role" in payload:
        updates.append("role = :role")
        params["role"] = payload["role"]

    if "is_active" in payload:
        updates.append("is_active = :is_active")
        params["is_active"] = payload["is_active"]

    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    updated = db.execute(
        text(f"""
            UPDATE users
               SET {", ".join(updates)}
             WHERE id = :uid
            RETURNING id, email, role, first_name, last_name, is_active
        """),
        params,
    ).mappings().first()
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    db.execute(
        text("""INSERT INTO audit_event (actor_user_id, action, entity_type, entity_id)
                VALUES (:actor, 'admin.user.updated', 'user', :entity_id)"""),
        {"actor": admin[0], "entity_id": user_id},
    )
    db.commit()
    return updated

@router.post("/{user_id}/reset-password", status_code=200)
def admin_reset_password(user_id: str, payload: dict, admin=Depends(require_admin), db: Session = Depends(get_db)):
    mode = payload.get("mode", "generate")
    user = db.execute(
        text("SELECT id, email, first_name, last_name FROM users WHERE id = :id"),
        {"id": user_id}
    ).mappings().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if mode == "manual":
        password = payload.get("password")
        if not password or len(password) < 15:
            raise HTTPException(status_code=400, detail="Password must be at least 15 characters")
        # Hash the password
        import argon2
        ph = argon2.PasswordHasher()
        hashed = ph.hash(password)
        db.execute(
            text("UPDATE users SET password_hash = :hash WHERE id = :id"),
            {"hash": hashed, "id": user_id}
        )
    else:
        # Generate random password
        chars = string.ascii_letters + string.digits + "!@#$%^&*"
        new_password = ''.join(random.choice(chars) for _ in range(20))

        import argon2
        ph = argon2.PasswordHasher()
        hashed = ph.hash(new_password)

        db.execute(
            text("UPDATE users SET password_hash = :hash WHERE id = :id"),
            {"hash": hashed, "id": user_id}
        )

        # Send email with new password
        try:
            from app.notifications.notifier import notify_password_reset
            user_name = " ".join(filter(None, [user.get("first_name"), user.get("last_name")])) or user["email"]
            notify_password_reset(user["email"], user_name, new_password)
        except Exception as e:
            print(f"[ADMIN] Failed to send password reset email: {e}")
            # Don't fail the request if email fails

    db.execute(
        text("""INSERT INTO audit_event (actor_user_id, action, entity_type, entity_id)
                VALUES (:actor, 'admin.password.reset', 'user', :entity_id)"""),
        {"actor": admin[0], "entity_id": user_id},
    )
    db.commit()
    return {"ok": True}

@router.post("/{user_id}/mfa/reset", status_code=200)
def admin_reset_mfa(user_id: str, admin=Depends(require_admin), db: Session = Depends(get_db)):
    user = db.execute(
        text("SELECT id, email, first_name, last_name FROM users WHERE id = :id"),
        {"id": user_id}
    ).mappings().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Delete MFA credential entirely to reset it
    db.execute(
        text("""
            DELETE FROM mfa_credential
             WHERE user_id = :uid
        """),
        {"uid": user_id},
    )

    # Send email notification
    try:
        from app.notifications.notifier import notify_mfa_reset
        user_name = " ".join(filter(None, [user.get("first_name"), user.get("last_name")])) or user["email"]
        notify_mfa_reset(user["email"], user_name)
    except Exception as e:
        print(f"[ADMIN] Failed to send MFA reset email: {e}")
        # Don't fail the request if email fails

    db.execute(
        text("""INSERT INTO audit_event (actor_user_id, action, entity_type, entity_id)
                VALUES (:actor, 'admin.mfa.reset', 'user', :entity_id)"""),
        {"actor": admin[0], "entity_id": user_id},
    )
    db.commit()
    return {"ok": True, "email": user["email"]}
