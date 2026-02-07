from datetime import date
from app.services.goal_math import weighted_need

def allocate_savings(savings_amount, goals, today: date):
    active_goals = [g for g in goals if not g.is_completed]

    if not active_goals:
        return []

    needs = {
        g.id: weighted_need(g, today)
        for g in active_goals
    }

    total_need = sum(needs.values())

    allocations = []

    for goal in active_goals:
        share = needs[goal.id] / total_need
        allocated = round(share * savings_amount, 2)

        allocations.append({
            "goal_id": goal.id,
            "allocated_amount": allocated
        })

    return allocations
