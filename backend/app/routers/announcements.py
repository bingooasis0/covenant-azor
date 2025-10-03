# backend/app/routers/announcements.py
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
import os, json

router = APIRouter(prefix="/admin/announcements", tags=["announcements"])

# Lightweight persistence without DB: data/announcements.json
DATA_FILE = os.environ.get("AZOR_ANNOUNCEMENTS_FILE", os.path.join(os.getcwd(), "data", "announcements.json"))
os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)

class AnnouncementDoc(BaseModel):
    items: list[str] = []

def _read() -> AnnouncementDoc:
    if not os.path.exists(DATA_FILE):
        return AnnouncementDoc(items=[])
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            raw = json.load(f)
            if isinstance(raw, dict) and isinstance(raw.get("items"), list):
                return AnnouncementDoc(items=[str(x) for x in raw["items"]])
            if isinstance(raw, list):
                return AnnouncementDoc(items=[str(x) for x in raw])
    except Exception:
        pass
    return AnnouncementDoc(items=[])

def _write(doc: AnnouncementDoc) -> None:
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump({"items": doc.items}, f, ensure_ascii=False, indent=2)

@router.get("", response_model=AnnouncementDoc)
def get_announcements():
    return _read()

@router.put("", response_model=AnnouncementDoc)
def put_announcements(doc: AnnouncementDoc):
    _write(doc)
    return doc
