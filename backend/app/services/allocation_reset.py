from sqlalchemy.orm import Session

from app.models.goal_allocation import GoalAllocation
from app.models.goal import Goal


def reset_allocations_for_savings(
    db: Session,
    savings_id: int,
    user_id: int
):
    """
    Reverts goal progress for allocations linked to a savings record.
    """

    allocations = db.query(GoalAllocation).filter(
        GoalAllocation.savings_id == savings_id
    ).all()

    for alloc in allocations:
        goal = db.query(Goal).filter(
            Goal.id == alloc.goal_id,
            Goal.user_id == user_id
        ).first()

        if goal:
            goal.current_amount -= alloc.allocated_amount
            if goal.current_amount < goal.target_amount:
                goal.is_completed = False

    for alloc in allocations:
        db.delete(alloc)
