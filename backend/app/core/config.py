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
    
    # LLM Provider Configuration
    LLM_PROVIDER: str = "ollama"  # ollama, openai, or gemini
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "neural-chat"
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-1.5-flash"
    
    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = 10

    # Schema Sync
    AUTO_SCHEMA_UPDATE: bool = False
    
    # Debug
    DEBUG: bool = False

    class Config:
        env_file = ".env"

    def get_allowed_origins(self) -> list[str]:
        """Parse ALLOWED_ORIGINS from comma-separated string."""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]

    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.ENVIRONMENT.lower() == "production"

settings = Settings()
