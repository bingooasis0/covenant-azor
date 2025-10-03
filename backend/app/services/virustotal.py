# backend/app/services/virustotal.py
import os
import time
import hashlib
import requests
from typing import Dict, Optional
from datetime import datetime, timedelta
from threading import Lock

class VirusTotalRateLimiter:
    """
    Rate limiter for VirusTotal API free tier:
    - 4 requests per minute
    - 500 requests per day
    - 15,500 requests per month
    """
    def __init__(self):
        self.minute_requests = []
        self.daily_requests = []
        self.monthly_requests = []
        self.lock = Lock()

        # Limits
        self.MAX_PER_MINUTE = 4
        self.MAX_PER_DAY = 500
        self.MAX_PER_MONTH = 15500

    def can_make_request(self) -> tuple[bool, str]:
        """Check if a request can be made. Returns (allowed, reason)"""
        with self.lock:
            now = datetime.now()

            # Clean old requests
            one_min_ago = now - timedelta(minutes=1)
            one_day_ago = now - timedelta(days=1)
            one_month_ago = now - timedelta(days=30)

            self.minute_requests = [t for t in self.minute_requests if t > one_min_ago]
            self.daily_requests = [t for t in self.daily_requests if t > one_day_ago]
            self.monthly_requests = [t for t in self.monthly_requests if t > one_month_ago]

            # Check limits
            if len(self.minute_requests) >= self.MAX_PER_MINUTE:
                return False, f"Rate limit: {self.MAX_PER_MINUTE} requests/minute exceeded"

            if len(self.daily_requests) >= self.MAX_PER_DAY:
                return False, f"Daily quota: {self.MAX_PER_DAY} requests/day exceeded"

            if len(self.monthly_requests) >= self.MAX_PER_MONTH:
                return False, f"Monthly quota: {self.MAX_PER_MONTH} requests/month exceeded"

            return True, ""

    def record_request(self):
        """Record that a request was made"""
        with self.lock:
            now = datetime.now()
            self.minute_requests.append(now)
            self.daily_requests.append(now)
            self.monthly_requests.append(now)

    def get_stats(self) -> Dict:
        """Get current usage stats"""
        with self.lock:
            return {
                "minute": len(self.minute_requests),
                "day": len(self.daily_requests),
                "month": len(self.monthly_requests),
                "limits": {
                    "minute": self.MAX_PER_MINUTE,
                    "day": self.MAX_PER_DAY,
                    "month": self.MAX_PER_MONTH
                }
            }

# Global rate limiter instance
_rate_limiter = VirusTotalRateLimiter()

class VirusTotalScanner:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("VIRUSTOTAL_API_KEY")
        self.base_url = "https://www.virustotal.com/api/v3"
        self.rate_limiter = _rate_limiter

    def get_file_hash(self, file_content: bytes) -> str:
        """Calculate SHA256 hash of file content"""
        return hashlib.sha256(file_content).hexdigest()

    def check_file_hash(self, file_hash: str) -> Optional[Dict]:
        """Check if file hash exists in VirusTotal database"""
        if not self.api_key:
            return None

        # Check rate limit
        allowed, reason = self.rate_limiter.can_make_request()
        if not allowed:
            raise Exception(reason)

        headers = {"x-apikey": self.api_key}
        url = f"{self.base_url}/files/{file_hash}"

        self.rate_limiter.record_request()
        response = requests.get(url, headers=headers, timeout=30)

        if response.status_code == 404:
            return None  # File not in database

        if response.status_code == 200:
            return response.json()

        raise Exception(f"VirusTotal API error: {response.status_code}")

    def upload_file(self, file_content: bytes, filename: str) -> str:
        """Upload file to VirusTotal for scanning. Returns analysis ID."""
        if not self.api_key:
            raise Exception("VirusTotal API key not configured")

        # Check rate limit
        allowed, reason = self.rate_limiter.can_make_request()
        if not allowed:
            raise Exception(reason)

        headers = {"x-apikey": self.api_key}
        url = f"{self.base_url}/files"

        files = {"file": (filename, file_content)}

        self.rate_limiter.record_request()
        response = requests.post(url, headers=headers, files=files, timeout=60)

        if response.status_code == 200:
            data = response.json()
            return data["data"]["id"]

        raise Exception(f"VirusTotal upload failed: {response.status_code}")

    def get_analysis(self, analysis_id: str) -> Dict:
        """Get analysis results"""
        if not self.api_key:
            raise Exception("VirusTotal API key not configured")

        # Check rate limit
        allowed, reason = self.rate_limiter.can_make_request()
        if not allowed:
            raise Exception(reason)

        headers = {"x-apikey": self.api_key}
        url = f"{self.base_url}/analyses/{analysis_id}"

        self.rate_limiter.record_request()
        response = requests.get(url, headers=headers, timeout=30)

        if response.status_code == 200:
            return response.json()

        raise Exception(f"VirusTotal analysis check failed: {response.status_code}")

    def scan_file(self, file_content: bytes, filename: str, max_wait: int = 300) -> Dict:
        """
        Scan a file and wait for results.
        Returns dict with keys: safe (bool), stats (dict), details (dict)
        """
        if not self.api_key:
            # If no API key, allow file but log warning
            return {
                "safe": True,
                "skipped": True,
                "reason": "VirusTotal API key not configured"
            }

        try:
            # First check if file hash exists
            file_hash = self.get_file_hash(file_content)
            existing = self.check_file_hash(file_hash)

            if existing:
                # File already scanned
                stats = existing["data"]["attributes"]["last_analysis_stats"]
                malicious = stats.get("malicious", 0)
                suspicious = stats.get("suspicious", 0)

                return {
                    "safe": malicious == 0 and suspicious == 0,
                    "stats": stats,
                    "cached": True,
                    "file_hash": file_hash
                }

            # Upload new file
            analysis_id = self.upload_file(file_content, filename)

            # Wait for analysis to complete
            start_time = time.time()
            while time.time() - start_time < max_wait:
                time.sleep(5)  # Wait 5 seconds between checks

                result = self.get_analysis(analysis_id)
                status = result["data"]["attributes"]["status"]

                if status == "completed":
                    stats = result["data"]["attributes"]["stats"]
                    malicious = stats.get("malicious", 0)
                    suspicious = stats.get("suspicious", 0)

                    return {
                        "safe": malicious == 0 and suspicious == 0,
                        "stats": stats,
                        "cached": False,
                        "file_hash": file_hash,
                        "analysis_id": analysis_id
                    }

            raise Exception("VirusTotal scan timeout")

        except Exception as e:
            # Log error but allow upload (fail open for availability)
            print(f"VirusTotal scan error: {e}")
            return {
                "safe": True,
                "error": str(e),
                "skipped": True
            }

    def get_rate_limit_stats(self) -> Dict:
        """Get current rate limit usage"""
        return self.rate_limiter.get_stats()
