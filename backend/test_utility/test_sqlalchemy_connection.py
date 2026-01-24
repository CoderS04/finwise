from sqlalchemy import text
from app.core.database import engine

print("Testing SQLAlchemy connection...")

try:
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        print(f"✓ SQLAlchemy connection successful!")
        print(f"✓ Query result: {result.fetchone()}")
except Exception as e:
    print(f"✗ SQLAlchemy error: {e}")
    import traceback
    traceback.print_exc()
