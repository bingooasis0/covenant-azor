
import argparse
import json
import msal
import requests
from pathlib import Path
import sys

GRAPH_SCOPES = ["https://graph.microsoft.com/Mail.Send"]

def load_cache(cache_path: Path):
    cache = msal.SerializableTokenCache()
    if cache_path.exists():
        cache.deserialize(cache_path.read_text(encoding="utf-8"))
    return cache

def main():
    p = argparse.ArgumentParser(description="Send a test email via Graph using the seeded token cache.")
    p.add_argument("--tenant-id", required=True)
    p.add_argument("--client-id", required=True)
    p.add_argument("--cache-path", default="graph_token_cache.json")
    p.add_argument("--to", required=True, help="Recipient email for the test message")
    p.add_argument("--subject", default="Azor Graph mail test")
    p.add_argument("--body", default="If you received this, delegated Graph mail is working.")
    args = p.parse_args()

    cache_path = Path(args.cache_path).expanduser().resolve()
    cache = load_cache(cache_path)

    app = msal.PublicClientApplication(
        client_id=args.client_id,
        authority=f"https://login.microsoftonline.com/{args.tenant_id}",
        token_cache=cache
    )

    accounts = app.get_accounts()
    if not accounts:
        print("No accounts found in cache. Run seed_graph_token.py first.", file=sys.stderr)
        sys.exit(1)

    result = app.acquire_token_silent(GRAPH_SCOPES, account=accounts[0])
    if "access_token" not in result:
        print("Silent token acquisition failed. Re-run seeding.", file=sys.stderr)
        sys.exit(2)

    headers = {"Authorization": f"Bearer {result['access_token']}", "Content-Type": "application/json"}
    payload = {
        "message": {
            "subject": args.subject,
            "body": {"contentType": "Text", "content": args.body},
            "toRecipients": [{"emailAddress": {"address": args.to}}]
        },
        "saveToSentItems": "true"
    }

    resp = requests.post("https://graph.microsoft.com/v1.0/me/sendMail", headers=headers, json=payload, timeout=20)
    if resp.status_code in (200, 202):
        print("OK: test mail accepted by Graph.")
    else:
        print(f"ERROR: {resp.status_code} {resp.text}")
        sys.exit(3)

    cache_path.write_text(cache.serialize(), encoding="utf-8")

if __name__ == "__main__":
    main()
