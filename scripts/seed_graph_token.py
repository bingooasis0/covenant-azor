
import argparse
import os
import sys
import json
import msal
from pathlib import Path
import stat

GRAPH_SCOPES = ["https://graph.microsoft.com/Mail.Send"]  # MSAL will add openid, profile, offline_access automatically

def secure_write(path: Path, data: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(data, encoding="utf-8")
    try:
        if os.name == "posix":
            os.chmod(path, 0o600)
        else:
            os.chmod(path, stat.S_IREAD | stat.S_IWRITE)
    except Exception:
        pass

def main():
    p = argparse.ArgumentParser(description="Seed Microsoft Graph delegated token cache via device code flow.")
    p.add_argument("--tenant-id", required=True, help="Directory (tenant) ID GUID")
    p.add_argument("--client-id", required=True, help="Application (client) ID GUID")
    p.add_argument("--cache-path", default="graph_token_cache.json", help="Path to save the token cache JSON")
    args = p.parse_args()

    authority = f"https://login.microsoftonline.com/{args.tenant_id}"
    cache_path = Path(args.cache_path).expanduser().resolve()

    cache = msal.SerializableTokenCache()
    if cache_path.exists():
        try:
            cache.deserialize(cache_path.read_text(encoding="utf-8"))
        except Exception:
            print("Warning: existing cache unreadable. Starting fresh.", file=sys.stderr)

    app = msal.PublicClientApplication(
        client_id=args.client_id,
        authority=authority,
        token_cache=cache
    )

    accounts = app.get_accounts()
    result = None
    if accounts:
        result = app.acquire_token_silent(GRAPH_SCOPES, account=accounts[0])

    if not result:
        flow = app.initiate_device_flow(scopes=GRAPH_SCOPES)
        if "user_code" not in flow:
            print("Failed to create device code flow:", flow, file=sys.stderr)
            sys.exit(1)

        print("\n=== Device Code Sign-in ===")
        print(f"Go to: {flow['verification_uri']}")
        print(f"Enter code: {flow['user_code']}")
        print("Sign in as the bot mailbox user and complete MFA.")
        print("===========================\n")

        result = app.acquire_token_by_device_flow(flow)

    if "access_token" in result:
        secure_write(cache_path, cache.serialize())
        print(f"OK: token cache saved to {cache_path}")
        expires_in = result.get("expires_in")
        if expires_in:
            print(f"Access token valid for ~{int(expires_in)} seconds. Refresh token stored in cache.")
        id_claims = result.get("id_token_claims", {})
        preferred = id_claims.get("preferred_username") or id_claims.get("upn")
        if preferred:
            print(f"Signed in as: {preferred}")
    else:
        print("ERROR acquiring token:", json.dumps(result, indent=2))
        sys.exit(2)

if __name__ == "__main__":
    main()
