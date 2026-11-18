from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import SessionLocal

from app.models.budget import Budget
from app.models.goal import Goal
from app.models.savings import MonthlySavings
from app.models.transaction import Transaction
from app.models.account import Account
from datetime import datetime, timedelta


def _get_month_expenses(db: Session, user_id: int, month: int, year: int) -> dict:
    """
    Helper function to get expenses for a specific month.
    """
    month_start = datetime(year, month, 1)
    # Calculate next month's start to get end of current month
    if month == 12:
        month_end = datetime(year + 1, 1, 1)
    else:
        month_end = datetime(year, month + 1, 1)

    monthly_income = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == user_id,
        Transaction.transaction_type == "income",
        Transaction.transaction_date >= month_start,
        Transaction.transaction_date < month_end
    ).scalar() or 0

    monthly_expense = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == user_id,
        Transaction.transaction_type == "expense",
        Transaction.transaction_date >= month_start,
        Transaction.transaction_date < month_end
    ).scalar() or 0

    return {
        "income": round(monthly_income, 2),
        "expense": round(monthly_expense, 2),
        "savings": round(monthly_income - monthly_expense, 2)
    }


def analyze_user_finances(user_id: int, months: list[int] = None) -> dict:
    """
    Fetches and summarizes user financial data.
    Returns compact context without raw transactions.
    
    Args:
        user_id: User ID
        months: Optional list of (month, year) tuples to fetch. 
                If None, returns current month. 
                Example: [(1, 2026), (2, 2026), (3, 2026)]
    """
    db = SessionLocal()
    try:
        today = datetime.today()
        current_month = today.month
        current_year = today.year

        # If months not specified, use current month
        if months is None:
            months = [(current_month, current_year)]

        # Fetch accounts
        accounts = db.query(Account).filter(
            Account.user_id == user_id
        ).all()
        
        total_balance = sum(acc.balance for acc in accounts) if accounts else 0

        # Fetch budgets (static, not month-specific)
        budgets = db.query(Budget).filter(
            Budget.user_id == user_id
        ).all()

        # Map category IDs to names for budget labels
        from app.models.category import Category
        category_ids = list({b.category_id for b in budgets if b.category_id is not None})
        category_map = {}
        if category_ids:
            categories = db.query(Category).filter(Category.id.in_(category_ids)).all()
            category_map = {c.id: c.name for c in categories}

        budget_summary = []
        total_budget = 0
        total_spent = 0

        for budget in budgets:
            # Skip budgets with no category (budget.category_id is None)
            if budget.category_id is None:
                continue
            
            # Calculate month boundaries for this budget's month/year
            month_start = datetime(budget.year, budget.month, 1)
            if budget.month == 12:
                month_end = datetime(budget.year + 1, 1, 1)
            else:
                month_end = datetime(budget.year, budget.month + 1, 1)
            
            # Only count expenses from the budget's specific month
            spent = db.query(func.sum(Transaction.amount)).filter(
                Transaction.user_id == user_id,
                Transaction.category_id == budget.category_id,
                Transaction.transaction_type == "expense",
                Transaction.transaction_date >= month_start,
                Transaction.transaction_date < month_end
            ).scalar() or 0

            budget_name = category_map.get(budget.category_id, "Category Budget")

            budget_summary.append({
                "name": budget_name,
                "limit": budget.monthly_limit,
                "spent": spent,
                "remaining": budget.monthly_limit - spent,
                "percentage": round((spent / budget.monthly_limit * 100), 1) if budget.monthly_limit > 0 else 0
            })
            total_budget += budget.monthly_limit
            total_spent += spent

        # Fetch goals (static, not month-specific)
        goals = db.query(Goal).filter(
            Goal.user_id == user_id
        ).all()

        goal_summary = []
        for goal in goals:
            progress = round((goal.current_amount / goal.target_amount * 100), 1) if goal.target_amount > 0 else 0
            goal_summary.append({
                "name": goal.name,
                "type": goal.goal_type,
                "target": goal.target_amount,
                "current": goal.current_amount,
                "remaining": goal.target_amount - goal.current_amount,
                "progress": progress,
                "completed": goal.is_completed
            })

        # Fetch recent transactions (count only, no details)
        recent_tx_count = db.query(func.count(Transaction.id)).filter(
            Transaction.user_id == user_id,
            Transaction.transaction_date >= today - timedelta(days=30)
        ).scalar() or 0

        # Fetch expenses for requested months
        monthly_breakdown = {}
        total_income_all = 0
        total_expense_all = 0

        for month_num, year_num in months:
            month_data = _get_month_expenses(db, user_id, month_num, year_num)
            month_key = f"{year_num}-{month_num:02d}"
            monthly_breakdown[month_key] = month_data
            total_income_all += month_data["income"]
            total_expense_all += month_data["expense"]

        # Use first month for snapshot (or current if not specified)
        first_month, first_year = months[0]
        monthly_income = monthly_breakdown.get(f"{first_year}-{first_month:02d}", {}).get("income", 0)
        monthly_expense = monthly_breakdown.get(f"{first_year}-{first_month:02d}", {}).get("expense", 0)

        # Fetch current month savings (for context)
        savings = db.query(MonthlySavings).filter(
            MonthlySavings.user_id == user_id,
            MonthlySavings.month == current_month,
            MonthlySavings.year == current_year
        ).first()

        savings_amount = savings.amount_saved if savings else 0
        savings_source = savings.source if savings else None

        # Get spending by category for first requested month
        from app.models.category import Category
        month_start = datetime(first_year, first_month, 1)
        if first_month == 12:
            month_end = datetime(first_year + 1, 1, 1)
        else:
            month_end = datetime(first_year, first_month + 1, 1)

        category_spending = db.query(
            Category.name,
            func.sum(Transaction.amount).label("total")
        ).join(
            Transaction, Transaction.category_id == Category.id
        ).filter(
            Transaction.user_id == user_id,
            Transaction.transaction_type == "expense",
            Transaction.transaction_date >= month_start,
            Transaction.transaction_date < month_end
        ).group_by(Category.name).all()

        category_summary = []
        for cat_name, cat_total in category_spending:
            if cat_total:
                category_summary.append({
                    "name": cat_name,
                    "amount": round(cat_total, 2),
                    "percentage": round((cat_total / monthly_expense * 100), 1) if monthly_expense > 0 else 0
                })

        return {
            "accounts": len(accounts),
            "total_balance": round(total_balance, 2),
            "current_month": current_month,
            "current_year": current_year,
            "monthly_income": round(monthly_income, 2),
            "monthly_expense": round(monthly_expense, 2),
            "monthly_savings": round(savings_amount, 2),
            "savings_source": savings_source,
            "budgets": budget_summary,
            "total_budget": round(total_budget, 2),
            "total_spent": round(total_spent, 2),
            "categories": category_summary,
            "goals": goal_summary,
            "active_goals": len([g for g in goal_summary if not g["completed"]]),
            "recent_transactions_count": recent_tx_count,
            "monthly_breakdown": monthly_breakdown,  # NEW: Multi-month data
            "requested_months": [f"{y}-{m:02d}" for m, y in months]  # NEW: Track requested months
        }

    finally:
        db.close()
