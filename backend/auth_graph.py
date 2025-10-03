#!/usr/bin/env python3
"""
One-time authentication script for Microsoft Graph API.
Creates token cache file for automated email sending.

Run this script once to authenticate with MFA, then the system
will automatically refresh tokens as needed.
"""

import os
import sys
from msal import PublicClientApplication, SerializableTokenCache

# Load configuration from environment
CLIENT_ID = os.getenv("MS_GRAPH_CLIENT_ID", "0f854af9-eda5-48b5-b818-b19fc55421fb")
TENANT_ID = os.getenv("MS_GRAPH_TENANT_ID", "9a30eba2-2bf7-4e9d-ab1c-0382a965e31e")
CACHE_PATH = os.getenv("BOT_CACHE_PATH", "graph_token_cache.json")
USERNAME = os.getenv("MS_GRAPH_SENDER", "noreply@covenanttechnology.net")

# Required scopes for sending mail
SCOPES = ["https://graph.microsoft.com/.default"]

def main():
    """Authenticate and cache token."""
    print("=" * 70)
    print("Microsoft Graph Authentication")
    print("=" * 70)
    print(f"Client ID: {CLIENT_ID}")
    print(f"Tenant ID: {TENANT_ID}")
    print(f"Username:  {USERNAME}")
    print(f"Cache:     {CACHE_PATH}")
    print("=" * 70)
    print()

    # Create MSAL app with serializable cache
    cache = SerializableTokenCache()
    authority = f"https://login.microsoftonline.com/{TENANT_ID}"
    app = PublicClientApplication(
        client_id=CLIENT_ID,
        authority=authority,
        token_cache=cache
    )

    # Try to get token from cache first
    accounts = app.get_accounts(username=USERNAME)
    result = None

    if accounts:
        print(f"Found cached account: {accounts[0]['username']}")
        print("Attempting silent token acquisition...")
        result = app.acquire_token_silent(SCOPES, account=accounts[0])

    if not result:
        print("\nInitiating device code flow...")
        print("This supports MFA authentication.")
        print()

        flow = app.initiate_device_flow(scopes=SCOPES)

        if "user_code" not in flow:
            print("ERROR: Failed to create device flow")
            print(flow.get("error_description", "Unknown error"))
            sys.exit(1)

        # Display authentication instructions
        print("=" * 70)
        print("AUTHENTICATION REQUIRED")
        print("=" * 70)
        print(flow["message"])
        print("=" * 70)
        print()
        print("⚠️  Important:")
        print("   1. Open the URL above in your browser")
        print("   2. Enter the code shown above")
        print("   3. Sign in with: noreply@covenanttechnology.net")
        print("   4. Complete MFA verification")
        print("   5. Return here once complete")
        print()

        # Wait for user to authenticate
        result = app.acquire_token_by_device_flow(flow)

    # Check result
    if "access_token" in result:
        print("✅ SUCCESS! Authentication complete.")
        print()
        print(f"Access token acquired for: {result.get('id_token_claims', {}).get('preferred_username', USERNAME)}")
        print(f"Token expires in: {result.get('expires_in', 'unknown')} seconds")
        print()

        # Save token cache
        with open(CACHE_PATH, "w") as f:
            f.write(cache.serialize())
        print(f"✅ Token cache saved to: {CACHE_PATH}")
        print()
        print("The system will now automatically refresh tokens as needed.")
        print("You do not need to run this script again unless the cache is deleted.")

        print()
        print("=" * 70)
        print("SETUP COMPLETE - Email system ready to use!")
        print("=" * 70)
        return 0
    else:
        print("❌ AUTHENTICATION FAILED")
        print()
        print(f"Error: {result.get('error', 'Unknown error')}")
        print(f"Description: {result.get('error_description', 'No description')}")
        print()
        if "correlation_id" in result:
            print(f"Correlation ID: {result['correlation_id']}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
