from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.budget import Budget
from app.services.budget_utils import (
    get_monthly_spending,
    get_category_spending
)
from app.services.budget_analyzer import analyze_budget
from app.services.budget_health import calculate_health_score
from app.services.budget_warnings import generate_warning

router = APIRouter(prefix="/budget-insights", tags=["Budget Insights"])

@router.get("/")
def get_budget_insights(
    month: int,
    year: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    insights = []

    budgets = db.query(Budget).filter(
        Budget.user_id == user.id,
        Budget.month == month,
        Budget.year == year
    ).all()

    for budget in budgets:
        spent = (
            get_category_spending(db, user.id, budget.category_id, month, year)
            if budget.category_id
            else get_monthly_spending(db, user.id, month, year)
        )

        status, ratio = analyze_budget(spent, budget.monthly_limit)
        health = calculate_health_score(ratio)
        warning = generate_warning(status)

        insights.append({
            "category_id": budget.category_id,
            "limit": budget.monthly_limit,
            "spent": spent,
            "status": status,
            "health_score": health,
            "warning": warning
        })

    return insights
