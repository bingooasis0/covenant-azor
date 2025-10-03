# backend/app/utils/mfa_policy.py
import os

def require_mfa() -> bool:
    return (os.environ.get("REQUIRE_MFA","false").lower() in ("1","true","yes","on"))

def issuer() -> str:
    return os.environ.get("MFA_ISSUER","Azor")
