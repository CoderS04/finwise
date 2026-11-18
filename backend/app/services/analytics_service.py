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


# 3️⃣ Income vs Expense (Atomic calculation)
def income_vs_expense(db, user_id, month, year):
    from sqlalchemy import case
    
    # Single atomic query to prevent race conditions
    result = db.query(
        func.sum(case(
            (Transaction.transaction_type == "income", Transaction.amount),
            else_=0
        )).label("income"),
        func.sum(case(
            (Transaction.transaction_type == "expense", Transaction.amount),
            else_=0
        )).label("expense")
    ).filter(
        Transaction.user_id == user_id,
        extract("month", Transaction.transaction_date) == month,
        extract("year", Transaction.transaction_date) == year
    ).first()

    income = result.income or 0 if result else 0
    expense = result.expense or 0 if result else 0

    return {
        "income": income,
        "expense": expense
    }


# 4️⃣ Savings Rate
def savings_rate(db, user_id, month, year):
    from app.models.savings import MonthlySavings
    
    data = income_vs_expense(db, user_id, month, year)

    income = data["income"]
    expense = data["expense"]
    
    # Check if there's a detected savings record for this month
    savings_record = db.query(MonthlySavings).filter(
        MonthlySavings.user_id == user_id,
        MonthlySavings.month == month,
        MonthlySavings.year == year
    ).first()
    
    # Use detected savings if available, otherwise calculate from transactions
    if savings_record:
        savings = savings_record.amount_saved
    else:
        savings = income - expense

    savings_rate = (savings / income * 100) if income > 0 else 0

    return {
        "savings": savings,
        "savings_rate": round(savings_rate, 2)
    }
