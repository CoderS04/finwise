from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from datetime import date

from app.services.savings_engine import detect_and_store_savings as run_savings_detection

router = APIRouter(prefix="/savings-detection", tags=["Savings Detection"])

@router.post("/")
def detect_and_allocate_savings(
    month: int,
    year: int,
    user_confirmed_amount: float | None = None,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    result = run_savings_detection(
        db,
        user.id,
        month,
        year,
        user_confirmed_amount
    )

    if result["savings"]["amount_saved"] <= 0:
        return {
            "message": "No savings detected",
            "details": result
        }

    savings_record = result["savings_record"]
    allocations = result["allocations"]
    reasoning = result["reasoning"]

    return {
        "savings": {
            "amount": savings_record.amount_saved,
            "source": savings_record.source,
            "month": savings_record.month,
            "year": savings_record.year
        },
        "allocations": allocations,
        "reasoning": reasoning
    }


@router.post("/cron")
def run_monthly_savings_detection(
    month: int | None = None,
    year: int | None = None,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    today = date.today()
    if month is None or year is None:
        if today.month == 1:
            month = 12
            year = today.year - 1
        else:
            month = today.month - 1
            year = today.year

    return run_savings_detection(
        db,
        user.id,
        month,
        year
    )
