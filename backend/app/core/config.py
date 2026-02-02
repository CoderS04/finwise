from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    APP_NAME: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    DATABASE_URL: str
    ENVIRONMENT: str = "development"  # development, staging, production
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:5173"  # Comma-separated

    class Config:
        env_file = ".env"

    def get_allowed_origins(self) -> list[str]:
        """Parse ALLOWED_ORIGINS from comma-separated string."""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]

    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.ENVIRONMENT.lower() == "production"

settings = Settings()
