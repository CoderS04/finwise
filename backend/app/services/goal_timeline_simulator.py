from datetime import date
from app.services.goal_math import months_left

def simulate_goal_timeline(
    goal,
    extra_monthly_saving: float
):
    """
    Returns how many months earlier the goal can be completed
    """
    if extra_monthly_saving <= 0:
        return 0

    remaining = goal.target_amount - goal.current_amount
    if remaining <= 0:
        return 0

    current_months = months_left(goal.target_date, date.today())

    accelerated_months = remaining / extra_monthly_saving

    months_saved = current_months - accelerated_months

    return max(0, round(months_saved))
