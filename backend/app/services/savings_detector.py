from sqlalchemy import func, extract
from app.models.transaction import Transaction
from app.services.savings_policy import (
    MIN_SURPLUS_THRESHOLD,
    DEFAULT_INFERENCE_RATE
)

def calculate_monthly_income_expense(db, user_id, month, year):
    income = (
        db.query(func.sum(Transaction.amount))
        .filter(
            Transaction.user_id == user_id,
            Transaction.transaction_type == "income",
            extract("month", Transaction.transaction_date) == month,
            extract("year", Transaction.transaction_date) == year
        )
        .scalar() or 0
    )

    expense = (
        db.query(func.sum(Transaction.amount))
        .filter(
            Transaction.user_id == user_id,
            Transaction.transaction_type == "expense",
            extract("month", Transaction.transaction_date) == month,
            extract("year", Transaction.transaction_date) == year
        )
        .scalar() or 0
    )

    return income, expense


def detect_savings(
    db,
    user_id: int,
    month: int,
    year: int,
    user_confirmed_amount: float | None = None
):
    """
    Returns detected savings + metadata.
    """

    income, expense = calculate_monthly_income_expense(
        db, user_id, month, year
    )

    surplus = income - expense

    # Case 1: No surplus
    if surplus < MIN_SURPLUS_THRESHOLD:
        return {
            "amount_saved": 0,
            "reason": "insufficient_surplus",
            "surplus": surplus,
            "income": income,
            "expense": expense
        }

    # Case 2: User explicitly confirms savings
    if user_confirmed_amount is not None:
        safe_amount = min(user_confirmed_amount, surplus)

        return {
            "amount_saved": round(safe_amount, 2),
            "reason": "user_confirmed",
            "surplus": surplus,
            "income": income,
            "expense": expense
        }

    # Case 3: Inferred savings (default)
    inferred = surplus * DEFAULT_INFERENCE_RATE

    return {
        "amount_saved": round(inferred, 2),
        "reason": "inferred",
        "surplus": surplus,
        "income": income,
        "expense": expense
    }
