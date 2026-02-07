from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.goal import Goal
from app.services.goal_insights import (
    goal_progress_insight,
    feasibility_insight,
    acceleration_insight
)

router = APIRouter(prefix="/goal-insights", tags=["Goal Insights"])

@router.get("/{goal_id}")
def get_goal_insights(
    goal_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    goal = db.query(Goal).filter(
        Goal.id == goal_id,
        Goal.user_id == user.id
    ).first()

    avg_allocation = 3000  # derived from allocations later
    budget_pressure = {
        "category": "Food",
        "monthly_overspend": 2000
    }

    return {
        "goal": goal.name,
        "insights": [
            goal_progress_insight(goal),
            feasibility_insight(goal, avg_allocation),
            acceleration_insight(goal, budget_pressure)
        ]
    }
