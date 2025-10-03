
from typing import List, Optional, Dict
import msal, requests
import base64
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
    print(f"[Graph] Cache file: {path}, exists: {path.exists()}, size: {path.stat().st_size if path.exists() else 0}")
    print(f"[Graph] Found {len(accts)} accounts in cache")
    if accts:
        print(f"[Graph] Account: {accts[0].get('username', 'unknown')}")

    res = app.acquire_token_silent(SCOPE, account=accts[0] if accts else None)
    if not res or "access_token" not in res:
        error_detail = res.get("error_description") if res else "No response from MSAL"
        print(f"[Graph] Token acquisition failed: {error_detail}")
        raise RuntimeError(f"Graph token unavailable. Reseat device-code cache. Detail: {error_detail}")

    print(f"[Graph] Token acquired successfully")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(cache.serialize(), encoding="utf-8")
    return res["access_token"]

def send_mail(to: List[str], subject: str, body_text: str, attachments: Optional[List[Dict]] = None):
    """
    Send email via Microsoft Graph API.

    Args:
        to: List of recipient email addresses
        subject: Email subject
        body_text: Email body (plain text)
        attachments: Optional list of attachments, each dict with:
            - name: filename
            - content_type: MIME type
            - content: bytes content
    """
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

    # Add attachments if provided
    if attachments:
        payload["message"]["attachments"] = []
        for att in attachments:
            # Encode file content as base64
            content_bytes = att.get("content", b"")
            if isinstance(content_bytes, memoryview):
                content_bytes = bytes(content_bytes)
            content_b64 = base64.b64encode(content_bytes).decode('utf-8')

            payload["message"]["attachments"].append({
                "@odata.type": "#microsoft.graph.fileAttachment",
                "name": att.get("name", "attachment"),
                "contentType": att.get("content_type", "application/octet-stream"),
                "contentBytes": content_b64
            })

    r = requests.post("https://graph.microsoft.com/v1.0/me/sendMail", headers=h, json=payload, timeout=20)
    if r.status_code not in (200, 202):
        raise RuntimeError(f"Graph sendMail failed: {r.status_code} {r.text}")
