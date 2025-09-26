# backend/app/security/jwt.py
import os, time, hmac, hashlib, base64, json

def _b64url(data: bytes) -> bytes:
    return base64.urlsafe_b64encode(data).rstrip(b"=")

def _b64url_decode(data: str) -> bytes:
    pad = '=' * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + pad)

def create_access_token(sub: str, role: str, exp_minutes: int = 30) -> str:
    header = {"alg":"HS256","typ":"JWT"}
    now = int(time.time())
    payload = {"sub": sub, "role": role, "exp": now + exp_minutes*60, "iat": now}
    secret = os.getenv("JWT_SECRET", "devsecret").encode("utf-8")
    header_b64 = _b64url(json.dumps(header, separators=(",",":")).encode("utf-8"))
    payload_b64 = _b64url(json.dumps(payload, separators=(",",":")).encode("utf-8"))
    signing_input = header_b64 + b"." + payload_b64
    sig = hmac.new(secret, signing_input, hashlib.sha256).digest()
    token = signing_input + b"." + _b64url(sig)
    return token.decode("utf-8")

class JWTError(Exception):
    pass

def decode_token(token: str) -> dict:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            raise JWTError("malformed")
        header = json.loads(_b64url_decode(parts[0]).decode("utf-8"))
        payload = json.loads(_b64url_decode(parts[1]).decode("utf-8"))
        sig = _b64url_decode(parts[2])
        if header.get("alg") != "HS256":
            raise JWTError("alg")
        secret = os.getenv("JWT_SECRET", "devsecret").encode("utf-8")
        expected = hmac.new(secret, (parts[0]+"."+parts[1]).encode("utf-8"), hashlib.sha256).digest()
        if not hmac.compare_digest(sig, expected):
            raise JWTError("sig")
        if int(payload.get("exp", 0)) < int(time.time()):
            raise JWTError("exp")
        return payload
    except Exception as e:
        raise JWTError(str(e))
