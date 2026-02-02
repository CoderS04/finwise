"""
Seed default categories into the database.
This script only inserts categories if they don't already exist.
Safe to run multiple times.
"""

from sqlalchemy import select
from app.core.database import SessionLocal, Base, engine
from app.models.category import Category


# Define default categories
DEFAULT_CATEGORIES = [
    {"name": "Food", "type": "expense", "is_system": True},
    {"name": "Transport", "type": "expense", "is_system": True},
    {"name": "Shopping", "type": "expense", "is_system": True},
    {"name": "Entertainment", "type": "expense", "is_system": True},
    {"name": "Rent", "type": "expense", "is_system": True},
    {"name": "Utilities", "type": "expense", "is_system": True},
    {"name": "Healthcare", "type": "expense", "is_system": True},
    {"name": "Salary", "type": "income", "is_system": True},
    {"name": "Freelance", "type": "income", "is_system": True},
    {"name": "Investment", "type": "income", "is_system": True},
    {"name": "Uncategorized", "type": "both", "is_system": True},
]


def seed_categories():
    """Seed default categories if they don't exist."""
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if categories already exist
        existing_count = db.query(Category).count()
        
        if existing_count > 0:
            print(f"✓ Database already contains {existing_count} categories. Skipping seed.")
            return
        
        # Insert default categories
        for category_data in DEFAULT_CATEGORIES:
            category = Category(**category_data)
            db.add(category)
        
        db.commit()
        print(f"✓ Successfully seeded {len(DEFAULT_CATEGORIES)} default categories:")
        for cat in DEFAULT_CATEGORIES:
            print(f"  - {cat['name']} ({cat['type']})")
    
    except Exception as e:
        db.rollback()
        print(f"✗ Error seeding categories: {str(e)}")
        raise
    
    finally:
        db.close()


if __name__ == "__main__":
    seed_categories()
