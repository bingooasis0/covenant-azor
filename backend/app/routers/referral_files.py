# backend/app/routers/referral_files.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi import status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db import get_session
import os, re

router = APIRouter(prefix="/referrals", tags=["referral-files"])

MAX_FILES = int(os.getenv("UPLOAD_MAX_FILES", "10"))
MAX_FILE_MB = int(os.getenv("UPLOAD_MAX_FILE_MB", "25"))
MAX_TOTAL_MB = int(os.getenv("UPLOAD_MAX_TOTAL_MB", "100"))
UPLOAD_ROOT = os.getenv("UPLOAD_ROOT", os.path.abspath(os.path.join(os.getcwd(), "uploads")))

SAFE_NAME_RE = re.compile(r"[^A-Za-z0-9._-]+")

def _safe_name(name: str) -> str:
    base = os.path.basename(name)
    return SAFE_NAME_RE.sub("_", base)

def _ensure_dir(path: str):
    os.makedirs(path, exist_ok=True)

@router.post("/{ref_id}/files")
async def upload_referral_files(ref_id: str, files: list[UploadFile] = File(...), db: Session = Depends(get_session)):
    if not files or len(files) == 0:
        raise HTTPException(status_code=400, detail="No files provided")
    if len(files) > MAX_FILES:
        raise HTTPException(status_code=400, detail=f"Too many files (max {MAX_FILES})")

    total_bytes = 0
    for f in files:
        # NOTE: content_type accepted any; just log/reject zero bytes and oversize
        # We must read to compute size safely; do per-file check
        content = await f.read()
        size = len(content)
        await f.seek(0)
        if size == 0:
            raise HTTPException(status_code=400, detail=f"Zero-byte file: {f.filename}")
        if size > MAX_FILE_MB * 1024 * 1024:
            raise HTTPException(status_code=400, detail=f"File too large: {f.filename} (> {MAX_FILE_MB} MB)")
        total_bytes += size
        if total_bytes > MAX_TOTAL_MB * 1024 * 1024:
            raise HTTPException(status_code=400, detail=f"Total upload size exceeds {MAX_TOTAL_MB} MB")

    # Store under uploads/referrals/<ref_id>/
    dest_dir = os.path.join(UPLOAD_ROOT, "referrals", ref_id)
    _ensure_dir(dest_dir)

    saved = []
    for f in files:
        safe = _safe_name(f.filename or "unnamed")
        dest = os.path.join(dest_dir, safe)
        # write
        with open(dest, "wb") as out:
            chunk = await f.read()  # safe: small sizes; for large, stream chunks
            out.write(chunk)
        saved.append({"name": safe, "path": dest})

    return {"ok": True, "saved": saved}
