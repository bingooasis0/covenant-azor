# backend/app/routers/users.py
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
import io, base64, json, secrets
import bcrypt, pyotp, qrcode

from app.db import get_session
from app.deps.session import require_session

# make audit optional
try:
    from app.audit_helper import write_audit  # type: ignore
except Exception as ex:  # pragma: no cover
    print(f"[users] audit_helper disabled: {ex}")
    def write_audit(*_a, **_k):  # no-op
        return None

router = APIRouter(prefix="/users", tags=["users"])

# ---------------- Password change ----------------
@router.post("/change-password")
def change_password(payload: dict, user=Depends(require_session), db: Session = Depends(get_session)):
    sub = str(user["id"])
    old_password = (payload.get("old_password") or "").strip()
    new_password = (payload.get("new_password") or "").strip()
    if not old_password or not new_password:
        raise HTTPException(status_code=400, detail="old_password and new_password are required")
    if len(new_password) < 15:
        raise HTTPException(status_code=400, detail="new_password must be >= 15 chars")
    if old_password == new_password:
        raise HTTPException(status_code=400, detail="new_password must differ from old_password")

    row = db.execute(
        text("SELECT id, password_hash, is_active FROM users WHERE id=:id LIMIT 1"),
        {"id": sub},
    ).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    if row.get("is_active", True) is False:
        raise HTTPException(status_code=403, detail="User disabled")

    try:
        if not bcrypt.checkpw(old_password.encode("utf-8"), row["password_hash"].encode("utf-8")):
            raise HTTPException(status_code=400, detail="old_password invalid")
    except Exception:
        raise HTTPException(status_code=400, detail="old_password invalid")

    new_hash = bcrypt.hashpw(new_password.encode("utf-8"), bcrypt.gensalt(12)).decode("utf-8")
    db.execute(text("UPDATE users SET password_hash=:ph WHERE id=:id"),
               {"ph": new_hash, "id": sub})
    db.commit()
    try:
        write_audit(db, sub, "change_password", "user", sub)
    except Exception:
        pass
    return {"ok": True}

# ---------------- MFA helpers ----------------
def _gen_recovery_codes(n: int = 10) -> list[str]:
    out = []
    for _ in range(n):
        h = secrets.token_hex(4).upper()  # 8 hex chars
        out.append(f"{h[:4]}-{h[4:]}")
    return out

def _qr_data_url(otpauth: str) -> str:
    img = qrcode.make(otpauth)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()

# ---------------- MFA enrollment + verify ----------------
@router.post("/mfa/setup")
def mfa_setup(user=Depends(require_session), db: Session = Depends(get_session)):
    # No 'verified' column in your DB → rely on 'enabled'
    row = db.execute(
        text("SELECT secret, enabled FROM mfa_credential WHERE user_id=:u LIMIT 1"),
        {"u": user["id"]},
    ).mappings().first()

    secret = (row["secret"] if row else None) or pyotp.random_base32()
    totp = pyotp.TOTP(secret)
    otpauth_url = totp.provisioning_uri(name=user["email"], issuer_name="Covenant Azor")
    qr = _qr_data_url(otpauth_url)

    plain_codes = _gen_recovery_codes(10)
    hashed_codes = [bcrypt.hashpw(c.encode(), bcrypt.gensalt(12)).decode() for c in plain_codes]

    if row:
        db.execute(
            text("""UPDATE mfa_credential
                    SET secret=:s, recovery_codes=:rc, enabled=FALSE
                    WHERE user_id=:u"""),
            {"s": secret, "rc": json.dumps(hashed_codes), "u": user["id"]},
        )
    else:
        db.execute(
            text("""INSERT INTO mfa_credential (user_id, secret, enabled, recovery_codes)
                    VALUES (:u, :s, FALSE, :rc)"""),
            {"u": user["id"], "s": secret, "rc": json.dumps(hashed_codes)},
        )

    db.commit()
    # include both keys for compatibility with different front-ends
    return {"qr": qr, "otpauth_url": otpauth_url, "otpauth": otpauth_url, "secret": secret, "recovery_codes": plain_codes}

@router.post("/mfa/verify")
def mfa_verify(payload: dict, user=Depends(require_session), db: Session = Depends(get_session)):
    code = (payload.get("code") or "").strip()
    recovery_code = (payload.get("recovery_code") or "").strip()

    row = db.execute(
        text("SELECT secret, recovery_codes FROM mfa_credential WHERE user_id=:u LIMIT 1"),
        {"u": user["id"]},
    ).mappings().first()
    if not row:
        print(f"[MFA] No credential found for user {user['id']}")
        raise HTTPException(status_code=400, detail={"code": "mfa_not_enrolled"})

    # verify via authenticator code
    if code:
        totp = pyotp.TOTP(row["secret"])
        is_valid = totp.verify(str(code), valid_window=1)
        print(f"[MFA] Code verification for user {user['id']}: {is_valid}")
        if not is_valid:
            raise HTTPException(status_code=400, detail={"code": "invalid_mfa_code"})
        db.execute(text("UPDATE mfa_credential SET enabled=TRUE WHERE user_id=:u"),
                   {"u": user["id"]})
        db.commit()
        return {"ok": True}

    # or consume a recovery code
    if recovery_code:
        hashes = row.get("recovery_codes") or []
        if isinstance(hashes, str):
            try:
                hashes = json.loads(hashes)
            except Exception:
                hashes = []
        idx = -1
        for i, h in enumerate(hashes):
            try:
                if bcrypt.checkpw(recovery_code.encode(), h.encode()):
                    idx = i
                    break
            except Exception:
                continue
        if idx < 0:
            raise HTTPException(status_code=400, detail={"code": "invalid_recovery_code"})
        del hashes[idx]
        db.execute(
            text("""UPDATE mfa_credential
                    SET enabled=TRUE, recovery_codes=:rc, updated_at=now()
                    WHERE user_id=:u"""),
            {"u": user["id"], "rc": json.dumps(hashes)},
        )
        db.commit()
        return {"ok": True}

    raise HTTPException(status_code=400, detail={"code": "mfa_code_required"})
