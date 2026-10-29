"""Application configuration loaded from environment variables.

Uses pydantic-settings so every value can be overridden via the environment
or a local ``.env`` file. No secret is ever hardcoded.
"""
from functools import lru_cache
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # Application
    app_name: str = "SaarthiText"
    environment: str = "development"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Security
    secret_key: str = "change-me-to-a-long-random-secret"
    access_token_expire_minutes: int = 60 * 24 * 7
    algorithm: str = "HS256"

    # Database
    database_url: str = "sqlite:///./saarthitext.db"

    # LLM provider
    llm_provider: str = "gemini"
    llm_model: str = "gemini-3.8-flash"
    llm_max_tokens: int = 4000
    anthropic_api_key: str = ""
    openai_api_key: str = ""
    openai_base_url: str = ""
    openrouter_api_key: str = ""
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    google_api_key: str = ""

    # Uploads
    max_upload_mb: int = 10
    upload_dir: str = "./uploads"

    @property
    def cors_origin_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_mb * 1024 * 1024

    @field_validator("secret_key")
    @classmethod
    def _warn_default_secret(cls, v: str) -> str:
        return v


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
