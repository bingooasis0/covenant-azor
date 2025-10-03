# backend/app/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # auth
    JWT_SECRET: str = "change-me"
    JWT_ALGORITHM: str = "HS256"
    AUTH_COOKIE_NAME: str = "azor_access"

    # MFA settings
    REQUIRE_MFA: bool = True
    MFA_BOOTSTRAP_ALLOW: bool = False

    # make this optional so its presence never crashes import
    FRONTEND_ORIGIN: str | None = None

    # Microsoft Graph API for sending emails
    MS_GRAPH_CLIENT_ID: str | None = None
    MS_GRAPH_TENANT_ID: str | None = None
    MS_GRAPH_SENDER: str = "noreply@covenanttechnology.net"
    BOT_CACHE_PATH: str = "graph_token_cache.json"

    # accept unknown env keys so extras never break app startup
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
