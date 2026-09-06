import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "Kisan Dost - AI Agricultural Assistant"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # AI & API Configuration
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.6-flash"
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:////tmp/kisan_dost.db" if os.environ.get("VERCEL") else "sqlite+aiosqlite:///./kisan_dost.db"
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    
    # Open-Meteo Weather API base URLs
    WEATHER_API_URL: str = "https://api.open-meteo.com/v1/forecast"
    GEOCODING_API_URL: str = "https://geocoding-api.open-meteo.com/v1/search"

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
