from datetime import date
from app.services.goal_math import months_left

def goal_progress_insight(goal):
    progress = (goal.current_amount / goal.target_amount) * 100
    return {
        "type": "PROGRESS",
        "progress_percent": round(progress, 2)
    }


def feasibility_insight(goal, avg_monthly_allocation):
    remaining = goal.target_amount - goal.current_amount
    if avg_monthly_allocation <= 0:
        return {
            "type": "FEASIBILITY",
            "feasible": False,
            "reason": "No savings allocated"
        }

    months_needed = remaining / avg_monthly_allocation
    target_months = months_left(goal.target_date, date.today())

    return {
        "type": "FEASIBILITY",
        "on_track": months_needed <= target_months,
        "months_needed": round(months_needed, 1),
        "target_months": target_months
    }

def acceleration_insight(goal, budget_pressure):
    """
    budget_pressure example:
    {
      "category": "Food",
      "monthly_overspend": 2000
    }
    """

    if not budget_pressure:
        return None

    months_saved = round(budget_pressure["monthly_overspend"] / 1000)

    return {
        "type": "ACCELERATION",
        "action": {
            "category": budget_pressure["category"],
            "reduce_by_percent": 10
        },
        "impact": {
            "months_earlier": max(1, months_saved)
        }
    }
