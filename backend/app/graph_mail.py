
from typing import List
import msal, json, requests
from pathlib import Path
from app.config import settings

SCOPE = ["https://graph.microsoft.com/Mail.Send"]

def _load_cache(cache_path: Path):
    cache = msal.SerializableTokenCache()
    if cache_path.exists():
        cache.deserialize(cache_path.read_text(encoding="utf-8"))
    return cache

def _save_cache(cache, cache_path: Path):
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    cache_path.write_text(cache.serialize(), encoding="utf-8")

def _acquire_token():
    cache_path = Path(settings.BOT_CACHE_PATH)
    cache = _load_cache(cache_path)
    app = msal.PublicClientApplication(
        client_id=settings.MS_GRAPH_CLIENT_ID,
        authority=f"https://login.microsoftonline.com/{settings.MS_GRAPH_TENANT_ID}",
        token_cache=cache
    )
    accounts = app.get_accounts()
    result = app.acquire_token_silent(SCOPE, account=accounts[0] if accounts else None)
    if not result:
        raise RuntimeError("Graph token unavailable. Reseat the device code cache.")
    _save_cache(cache, cache_path)
    return result["access_token"]

def send_mail(to: List[str], subject: str, body_text: str):
    token = _acquire_token()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    payload = {
        "message": {
            "subject": subject,
            "body": {"contentType": "Text", "content": body_text},
            "toRecipients": [{"emailAddress": {"address": a}} for a in to],
        },
        "saveToSentItems": "true",
    }
    resp = requests.post("https://graph.microsoft.com/v1.0/me/sendMail", headers=headers, json=payload, timeout=20)
    if resp.status_code not in (200, 202):
        raise RuntimeError(f"Graph sendMail failed: {resp.status_code} {resp.text}")
