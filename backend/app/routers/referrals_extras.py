
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import text
import uuid
import json
from app.dependencies import get_db, require_auth
from app.services.virustotal import VirusTotalScanner

router = APIRouter(prefix="/referrals", tags=["referrals-files"])
vt_scanner = VirusTotalScanner()

def _can_access_referral(db: Session, user_id: str, role: str, referral_id: str) -> bool:
    owner = db.execute(text("SELECT agent_id FROM referrals WHERE id = :id"), {"id": referral_id}).scalar()
    return bool(owner) and (role == "COVENANT" or str(owner) == str(user_id))

@router.get("/{referral_id}/files")
def list_referral_files(referral_id: str, auth=Depends(require_auth), db: Session = Depends(get_db)):
    user_id, role = auth
    if not _can_access_referral(db, user_id, role, referral_id):
        raise HTTPException(status_code=403, detail="Forbidden")

    rows = db.execute(
        text("""
            SELECT id, name, size_bytes, content_type, storage_path, created_at
              FROM referral_files
             WHERE referral_id = :rid
             ORDER BY created_at DESC
        """),
        {"rid": referral_id},
    ).mappings().all()
    return {"items": rows}

@router.post("/{referral_id}/files", status_code=200)
async def upload_referral_file(
    referral_id: str,
    file: UploadFile = File(...),
    auth=Depends(require_auth),
    db: Session = Depends(get_db)
):
    user_id, role = auth
    if not _can_access_referral(db, user_id, role, referral_id):
        raise HTTPException(status_code=403, detail="Forbidden")

    # Read file content
    content = await file.read()

    # Scan file with VirusTotal
    scan_result = vt_scanner.scan_file(content, file.filename or "file")

    # Block unsafe files
    if not scan_result.get("safe", True):
        stats = scan_result.get("stats", {})
        malicious = stats.get("malicious", 0)
        suspicious = stats.get("suspicious", 0)
        raise HTTPException(
            status_code=400,
            detail=f"File blocked: {malicious} malicious, {suspicious} suspicious detections"
        )

    file_id = str(uuid.uuid4())

    # Store file info in database with scan results
    db.execute(
        text("""
            INSERT INTO referral_files (id, referral_id, name, size_bytes, content_type, data, metadata)
            VALUES (:id, :rid, :name, :size, :ct, :data, CAST(:meta AS jsonb))
        """),
        {
            "id": file_id,
            "rid": referral_id,
            "name": file.filename or "unnamed",
            "size": len(content),
            "ct": file.content_type or "application/octet-stream",
            "data": content,
            "meta": json.dumps({
                "virus_scan": scan_result,
                "scanned_at": str(uuid.uuid1().time)
            })
        },
    )

    # Audit log
    db.execute(
        text("""
            INSERT INTO audit_event (actor_user_id, action, entity_type, entity_id)
            VALUES (:uid, :action, :entity_type, :entity_id)
        """),
        {
            "uid": user_id,
            "action": "referral.file.uploaded",
            "entity_type": "referral_file",
            "entity_id": file_id,
        },
    )
    db.commit()

    return {
        "file_id": file_id,
        "name": file.filename,
        "size": len(content),
        "content_type": file.content_type,
        "scan_result": scan_result
    }

@router.delete("/{referral_id}/files/{file_id}", status_code=200)
def delete_referral_file(referral_id: str, file_id: str, auth=Depends(require_auth), db: Session = Depends(get_db)):
    user_id, role = auth
    if not _can_access_referral(db, user_id, role, referral_id):
        raise HTTPException(status_code=403, detail="Forbidden")

    deleted = db.execute(
        text("DELETE FROM referral_files WHERE id = :fid AND referral_id = :rid"),
        {"fid": file_id, "rid": referral_id},
    ).rowcount
    if not deleted:
        raise HTTPException(status_code=404, detail="File not found")

    db.execute(
        text("""
            INSERT INTO audit_event (actor_user_id, action, entity_type, entity_id)
            VALUES (:uid, :action, :entity_type, :entity_id)
        """),
        {
            "uid": user_id,
            "action": "referral.file.deleted",
            "entity_type": "referral_file",
            "entity_id": file_id,
        },
    )
    db.commit()
    return {"ok": True}
