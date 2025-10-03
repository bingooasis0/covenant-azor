# app/security/ratelimit.py
import time
from collections import deque, defaultdict
from fastapi import HTTPException

# Simple in-memory fixed-window rate limiter (per-process).
# window_seconds: seconds, limit: max requests in window.
_hits: dict[str, deque[float]] = defaultdict(deque)

def check(key: str, window_seconds: int = 60, limit: int = 20):
    now = time.time()
    q = _hits[key]
    # drop old
    while q and now - q[0] > window_seconds:
        q.popleft()
    if len(q) >= limit:
        raise HTTPException(status_code=429, detail="Too many requests")
    q.append(now)
