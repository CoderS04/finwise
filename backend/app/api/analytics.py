from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.services.analytics_service import (
    category_expense_pie,
    monthly_spending_trend,
    income_vs_expense,
    savings_rate
)

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/category-pie")
def category_pie(
    month: int,
    year: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    return category_expense_pie(db, user.id, month, year)

@router.get("/monthly-trend")
def monthly_trend(
    year: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    return monthly_spending_trend(db, user.id, year)

@router.get("/income-expense")
def income_expense(
    month: int,
    year: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    return income_vs_expense(db, user.id, month, year)

@router.get("/savings-rate")
def savings(
    month: int,
    year: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    return savings_rate(db, user.id, month, year)
