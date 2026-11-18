def build_reasoning(goal, allocation, months_left):
    return {
        "goal": goal.name,
        "priority": goal.priority,
        "allocated_this_month": allocation,
        "months_left": months_left,
        "remaining_amount": goal.target_amount - goal.current_amount,
        "logic": "Allocation based on priority and urgency"
    }
