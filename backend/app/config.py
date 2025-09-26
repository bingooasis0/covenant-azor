
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
import os

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql+psycopg://azor:azorpass@localhost:5434/azor")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "dev-change-me")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    MS_GRAPH_CLIENT_ID: Optional[str] = os.getenv("MS_GRAPH_CLIENT_ID")
    MS_GRAPH_TENANT_ID: Optional[str] = os.getenv("MS_GRAPH_TENANT_ID")
    BOT_CACHE_PATH: str = os.getenv("BOT_CACHE_PATH", r"C:\azor\secrets\graph_token_cache.json")

settings = Settings()
