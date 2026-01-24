from app.core.database import SessionLocal
from app.models.account import Account
from app.models.category import Category
from app.models.user import User
from datetime import datetime

db = SessionLocal()

# Get the test user
user = db.query(User).filter(User.email == "test@finwise.com").first()

if not user:
    print("❌ User 'test@finwise.com' not found. Please register first.")
    db.close()
    exit(1)

print(f"✓ Found user: {user.email} (ID: {user.id})")

# Insert demo account
demo_account = Account(
    user_id=user.id,
    account_name="Demo Cash Account",
    account_type="cash",
    currency="INR",
    created_at=datetime.utcnow()
)

db.add(demo_account)
db.commit()
db.refresh(demo_account)

print(f"✓ Created account: {demo_account.account_name} (ID: {demo_account.id})")

# Insert demo category
demo_category = Category(
    name="Food",
    type="expense",
    # created_at=datetime.utcnow()
)

db.add(demo_category)
db.commit()
db.refresh(demo_category)

print(f"✓ Created category: {demo_category.name} (ID: {demo_category.id})")

# Display summary
print("\n" + "="*60)
print("Demo data created successfully!")
print("="*60)
print(f"User ID: {user.id}")
print(f"Account ID: {demo_account.id}")
print(f"Category ID: {demo_category.id}")
print("\nYou can now test transactions with these values:")
print(f"""
{{
  "account_id": {demo_account.id},
  "amount": 100.50,
  "transaction_type": "expense",
  "description": "Coffee",
  "transaction_date": "2026-01-21T10:30:00",
  "category_id": {demo_category.id}
}}
""")

db.close()
