# backend/app/services/file_store.py
import os
import uuid
import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import UploadFile

BASE_DIR = os.environ.get("AZOR_UPLOAD_DIR", os.path.join(os.getcwd(), "uploads", "referrals"))

def _meta_path(referral_id: str) -> str:
    d = os.path.join(BASE_DIR, referral_id)
    os.makedirs(d, exist_ok=True)
    return os.path.join(d, ".meta.json")

def _load_meta(referral_id: str) -> List[Dict[str, Any]]:
    p = _meta_path(referral_id)
    if not os.path.exists(p):
        return []
    try:
        with open(p, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def _save_meta(referral_id: str, items: List[Dict[str, Any]]) -> None:
    p = _meta_path(referral_id)
    with open(p, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)

def list_files(referral_id: str) -> List[Dict[str, Any]]:
    return _load_meta(referral_id)

async def add_files(referral_id: str, files: List[UploadFile]) -> List[Dict[str, Any]]:
    items = _load_meta(referral_id)
    folder = os.path.join(BASE_DIR, referral_id)
    os.makedirs(folder, exist_ok=True)
    out: List[Dict[str, Any]] = []
    for up in files:
        fid = str(uuid.uuid4())
        ext = os.path.splitext(up.filename or "")[1]
        fname = f"{fid}{ext}"
        fpath = os.path.join(folder, fname)
        # save stream to disk
        with open(fpath, "wb") as f:
            while True:
                chunk = await up.read(1024 * 1024)
                if not chunk:
                    break
                f.write(chunk)
        size = os.path.getsize(fpath)
        item = {
            "file_id": fid,
            "name": up.filename or fname,
            "size": size,
            "content_type": up.content_type or "application/octet-stream",
            "created_at": datetime.utcnow().isoformat() + "Z",
            "path": fname,
        }
        items.append(item)
        out.append(item)
    _save_meta(referral_id, items)
    return out

def remove_file(referral_id: str, file_id: str) -> bool:
    items = _load_meta(referral_id)
    folder = os.path.join(BASE_DIR, referral_id)
    keep: List[Dict[str, Any]] = []
    removed = False
    for it in items:
        if it.get("file_id") == file_id:
            fpath = os.path.join(folder, it.get("path", ""))
            try:
                if os.path.exists(fpath):
                    os.remove(fpath)
            except Exception:
                pass
            removed = True
        else:
            keep.append(it)
    if removed:
        _save_meta(referral_id, keep)
    return removed
