from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.transaction import Transaction
from app.services.budget_suggester import suggest_budget

router = APIRouter(prefix="/budget-suggestions", tags=["Budget Suggestions"])

@router.get("/{category_id}")
def get_budget_suggestion(
    category_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """Get budget suggestion for a category based on last 3 months spending"""
    
    # Get last 3 months of spending for this category
    spending_data = (
        db.query(
            func.extract("month", Transaction.transaction_date).label("month"),
            func.extract("year", Transaction.transaction_date).label("year"),
            func.sum(Transaction.amount).label("total")
        )
        .filter(
            Transaction.user_id == user.id,
            Transaction.category_id == category_id,
            Transaction.transaction_type == "expense"
        )
        .group_by(
            func.extract("month", Transaction.transaction_date),
            func.extract("year", Transaction.transaction_date)
        )
        .order_by(
            func.extract("year", Transaction.transaction_date).desc(),
            func.extract("month", Transaction.transaction_date).desc()
        )
        .limit(3)
        .all()
    )
    
    history = [float(row.total) for row in spending_data]
    
    if not history:
        return {
            "suggested_budget": 0,
            "average_spend": 0,
            "buffer_percent": 20,
            "message": "No historical data available"
        }
    
    suggested, details = suggest_budget(history)
    
    return {
        "suggested_budget": suggested,
        "average_spend": details["average_spend"],
        "buffer_percent": details["buffer_percent"],
        "history": history
    }
