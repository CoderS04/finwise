def apply_allocations(goals, allocations):
    goal_map = {g.id: g for g in goals}

    for alloc in allocations:
        goal = goal_map[alloc["goal_id"]]
        goal.current_amount += alloc["allocated_amount"]

        if goal.current_amount >= goal.target_amount:
            goal.current_amount = goal.target_amount
            goal.is_completed = True
