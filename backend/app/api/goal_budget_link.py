from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.goal import Goal
from app.services.goal_budget_linker import (
    get_budget_pressure_signals,
    link_goals_with_budgets
)

router = APIRouter(prefix="/goal-budget-link", tags=["Goal-Budget Linking"])

@router.get("/")
def goal_budget_linking(
    month: int,
    year: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    goals = db.query(Goal).filter(
        Goal.user_id == user.id,
        Goal.is_completed == False
    ).all()

    budget_pressures = get_budget_pressure_signals(
        db, user.id, month, year
    )

    insights = link_goals_with_budgets(
        goals, budget_pressures
    )

    return {
        "month": month,
        "year": year,
        "goal_budget_links": insights
    }
