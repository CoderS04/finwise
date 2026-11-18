from datetime import date

PRIORITY_WEIGHTS = {
    "high": 3,
    "medium": 2,
    "low": 1
}

def months_left(target_date: date, today: date):
    return max(
        (target_date.year - today.year) * 12 +
        (target_date.month - today.month),
        1
    )

def required_monthly(goal, today):
    remaining = goal.target_amount - goal.current_amount
    return remaining / months_left(goal.target_date, today)

def weighted_need(goal, today):
    req = required_monthly(goal, today)
    weight = PRIORITY_WEIGHTS.get(goal.priority, 1)
    return req * weight
