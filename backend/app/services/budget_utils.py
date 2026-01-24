from sqlalchemy import func
from app.models.transaction import Transaction

def get_monthly_spending(db, user_id, month, year):
    return (
        db.query(func.sum(Transaction.amount))
        .filter(
            Transaction.user_id == user_id,
            Transaction.transaction_type == "expense",
            func.extract("month", Transaction.transaction_date) == month,
            func.extract("year", Transaction.transaction_date) == year
        )
        .scalar() or 0
    )

def get_category_spending(db, user_id, category_id, month, year):
    return (
        db.query(func.sum(Transaction.amount))
        .filter(
            Transaction.user_id == user_id,
            Transaction.category_id == category_id,
            Transaction.transaction_type == "expense",
            func.extract("month", Transaction.transaction_date) == month,
            func.extract("year", Transaction.transaction_date) == year
        )
        .scalar() or 0
    )
