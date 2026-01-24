from sqlalchemy import func, extract
from app.models.transaction import Transaction
from app.models.category import Category

# 1️⃣ Category-wise Expense Pie
def category_expense_pie(db, user_id, month, year):
    results = (
        db.query(
            Category.name,
            func.sum(Transaction.amount)
        )
        .join(Category, Category.id == Transaction.category_id)
        .filter(
            Transaction.user_id == user_id,
            Transaction.transaction_type == "expense",
            extract("month", Transaction.transaction_date) == month,
            extract("year", Transaction.transaction_date) == year
        )
        .group_by(Category.name)
        .all()
    )

    return [
        {"category": name, "amount": amount}
        for name, amount in results
    ]


# 2️⃣ Monthly Spending Trend (Expenses only)
def monthly_spending_trend(db, user_id, year):
    results = (
        db.query(
            extract("month", Transaction.transaction_date),
            func.sum(Transaction.amount)
        )
        .filter(
            Transaction.user_id == user_id,
            Transaction.transaction_type == "expense",
            extract("year", Transaction.transaction_date) == year
        )
        .group_by(extract("month", Transaction.transaction_date))
        .order_by(extract("month", Transaction.transaction_date))
        .all()
    )

    return [
        {
            "month": int(month),
            "amount": amount
        }
        for month, amount in results
    ]


# 3️⃣ Income vs Expense
def income_vs_expense(db, user_id, month, year):
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

    return {
        "income": income,
        "expense": expense
    }


# 4️⃣ Savings Rate
def savings_rate(db, user_id, month, year):
    data = income_vs_expense(db, user_id, month, year)

    income = data["income"]
    expense = data["expense"]
    savings = income - expense

    savings_rate = (savings / income * 100) if income > 0 else 0

    return {
        "savings": savings,
        "savings_rate": round(savings_rate, 2)
    }
