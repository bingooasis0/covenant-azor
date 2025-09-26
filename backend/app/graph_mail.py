
from typing import List
import msal, requests
from pathlib import Path
from app.config import settings

SCOPE = ["https://graph.microsoft.com/Mail.Send"]

def _cache():
    from msal import SerializableTokenCache
    p = Path(settings.BOT_CACHE_PATH)
    cache = SerializableTokenCache()
    if p.exists():
        cache.deserialize(p.read_text(encoding="utf-8"))
    return cache, p

def _token():
    if not settings.MS_GRAPH_CLIENT_ID or not settings.MS_GRAPH_TENANT_ID:
        raise RuntimeError("Graph client/tenant not configured")
    cache, path = _cache()
    app = msal.PublicClientApplication(
        client_id=settings.MS_GRAPH_CLIENT_ID,
        authority=f"https://login.microsoftonline.com/{settings.MS_GRAPH_TENANT_ID}",
        token_cache=cache
    )
    accts = app.get_accounts()
    res = app.acquire_token_silent(SCOPE, account=accts[0] if accts else None)
    if not res or "access_token" not in res:
        raise RuntimeError("Graph token unavailable. Reseat device-code cache.")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(cache.serialize(), encoding="utf-8")
    return res["access_token"]

def send_mail(to: List[str], subject: str, body_text: str):
    tok = _token()
    h = {"Authorization": f"Bearer {tok}", "Content-Type": "application/json"}
    payload = {
        "message": {
            "subject": subject,
            "body": {"contentType": "Text", "content": body_text},
            "toRecipients": [{"emailAddress": {"address": a}} for a in to],
        },
        "saveToSentItems": "true",
    }
    r = requests.post("https://graph.microsoft.com/v1.0/me/sendMail", headers=h, json=payload, timeout=20)
    if r.status_code not in (200, 202):
        raise RuntimeError(f"Graph sendMail failed: {r.status_code} {r.text}")
