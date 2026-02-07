from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.savings import MonthlySavings
from app.models.goal import Goal
from app.models.goal_allocation import GoalAllocation
from app.schemas.savings import SavingsCreate
from app.services.allocation_engine import allocate_savings
from app.services.goal_progress import apply_allocations

router = APIRouter(prefix="/savings", tags=["Savings"])

@router.post("/")
def save_and_allocate(
    data: SavingsCreate,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    savings = MonthlySavings(
        user_id=user.id,
        month=data.month,
        year=data.year,
        amount_saved=data.amount_saved
    )

    db.add(savings)
    db.commit()
    db.refresh(savings)

    goals = db.query(Goal).filter(
        Goal.user_id == user.id,
        Goal.is_completed == False
    ).all()

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
    db.commit()

    return {
        "saved": savings.amount_saved,
        "allocations": allocations
    }
