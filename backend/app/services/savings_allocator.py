from datetime import date
from sqlalchemy.orm import Session

from app.models.goal import Goal
from app.models.goal_allocation import GoalAllocation
from app.services.allocation_engine import allocate_savings
from app.services.goal_progress import apply_allocations
from app.services.allocation_reset import reset_allocations_for_savings


def recalculate_savings_allocations(
    db: Session,
    savings,
    user_id: int
):
    """
    Idempotent allocation: reset, recalculate, apply.
    """

    reset_allocations_for_savings(
        db,
        savings.id,
        user_id
    )

    goals = db.query(Goal).filter(
        Goal.user_id == user_id,
        Goal.is_completed == False
    ).all()

    if not goals:
        return []

    allocations = allocate_savings(
        savings.amount_saved,
        goals,
        date.today()
    )

    for alloc in allocations:
        db.add(GoalAllocation(
            savings_id=savings.id,
            goal_id=alloc["goal_id"],
            allocated_amount=alloc["allocated_amount"]
        ))

    apply_allocations(goals, allocations)

    return allocations
