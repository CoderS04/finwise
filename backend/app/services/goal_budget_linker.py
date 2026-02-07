from sqlalchemy.orm import Session
from app.models.budget import Budget
from app.models.category import Category
from app.services.budget_utils import (
    get_monthly_spending,
    get_category_spending
)

def get_budget_pressure_signals(db: Session, user_id: int, month: int, year: int):
    """
    Returns categories that are overspent and how much.
    """
    pressures = []

    budgets = db.query(Budget).filter(
        Budget.user_id == user_id,
        Budget.month == month,
        Budget.year == year,
        Budget.category_id != None
    ).all()

    for budget in budgets:
        spent = get_category_spending(
            db, user_id, budget.category_id, month, year
        )

        if spent > budget.monthly_limit:
            category = db.query(Category).get(budget.category_id)

            pressures.append({
                "category_id": budget.category_id,
                "category": category.name,
                "overspend": round(spent - budget.monthly_limit, 2)
            })

    return pressures

from app.services.goal_timeline_simulator import simulate_goal_timeline

def link_goals_with_budgets(
    goals,
    budget_pressures
):
    """
    For each goal, find which budget categories affect it the most.
    """
    insights = []

    for goal in goals:
        if goal.is_completed:
            continue

        for pressure in budget_pressures:
            overspend = pressure["overspend"]

            # Assume user can reduce 50% of overspend safely
            recoverable = overspend * 0.5

            months_earlier = simulate_goal_timeline(
                goal,
                recoverable
            )

            if months_earlier > 0:
                insights.append({
                    "goal_id": goal.id,
                    "goal": goal.name,
                    "type": "BUDGET_LINK",
                    "category": pressure["category"],
                    "overspend": overspend,
                    "suggested_reduction": round(recoverable, 2),
                    "impact": {
                        "months_earlier": months_earlier
                    }
                })

    return insights
