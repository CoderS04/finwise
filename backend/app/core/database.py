from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.engine import make_url
from app.core.config import settings


def normalize_database_url(database_url: str) -> str:
    """Normalize database schemes accepted by hosted providers."""
    if database_url.startswith("postgres://"):
        return database_url.replace("postgres://", "postgresql://", 1)
    if database_url.startswith("postgresql+psycopg://"):
        return database_url.replace("postgresql+psycopg://", "postgresql+psycopg2://", 1)
    if database_url.startswith("postgresql+psycopg2://"):
        return database_url
    return database_url


database_url = normalize_database_url(settings.DATABASE_URL)
parsed_url = make_url(database_url)

connect_args = {"connect_timeout": 5}
if parsed_url.host and "render.com" in parsed_url.host and "sslmode" not in parsed_url.query:
    connect_args["sslmode"] = "require"

engine = create_engine(
    database_url,
    connect_args=connect_args,
    pool_pre_ping=True,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

