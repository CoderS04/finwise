import psycopg2
from app.core.config import settings

print(f"Attempting to connect to: {settings.DATABASE_URL}")

try:
    # Parse the connection string
    conn = psycopg2.connect(
        host="localhost",
        port=5432,
        database="finwise",
        user="postgres",
        password="admin",
        connect_timeout=5
    )
    print("✓ Connection successful!")
    
    # Test the connection
    cursor = conn.cursor()
    cursor.execute("SELECT 1")
    result = cursor.fetchone()
    print(f"✓ Query executed successfully: {result}")
    
    cursor.close()
    conn.close()
    
except psycopg2.OperationalError as e:
    print(f"✗ Connection failed: {e}")
except psycopg2.DatabaseError as e:
    print(f"✗ Database error: {e}")
except Exception as e:
    print(f"✗ Unexpected error: {e}")
