from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.budget import BudgetCreate, BudgetResponse
from app.models.budget import Budget
from app.core.database import get_db
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/budgets", tags=["Budgets"])

@router.post("/", response_model=BudgetResponse)
def create_or_update_budget(
    data: BudgetCreate,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    if data.monthly_limit <= 0:
        raise HTTPException(status_code=400, detail="Budget must be positive")

    # Check if monthly budget exists and validate category budget doesn't exceed it
    if data.category_id is not None:  # This is a category budget
        monthly_budget = db.query(Budget).filter(
            Budget.user_id == user.id,
            Budget.category_id == None,
            Budget.month == data.month,
            Budget.year == data.year
        ).first()
        
        if monthly_budget:
            # Calculate sum of existing category budgets (excluding current one if updating)
            existing_categories = db.query(Budget).filter(
                Budget.user_id == user.id,
                Budget.category_id != None,
                Budget.month == data.month,
                Budget.year == data.year
            ).all()
            
            # Calculate total if we add this budget
            sum_category_budgets = sum(
                cat.monthly_limit for cat in existing_categories 
                if cat.category_id != data.category_id
            ) + data.monthly_limit
            
            if sum_category_budgets > monthly_budget.monthly_limit:
                raise HTTPException(
                    status_code=400,
                    detail=f"Sum of category budgets (₹{sum_category_budgets}) cannot exceed monthly budget (₹{monthly_budget.monthly_limit})"
                )
    
    else:  # This is a monthly budget (category_id is None)
        # Calculate sum of all existing category budgets
        existing_categories = db.query(Budget).filter(
            Budget.user_id == user.id,
            Budget.category_id != None,
            Budget.month == data.month,
            Budget.year == data.year
        ).all()
        
        sum_category_budgets = sum(cat.monthly_limit for cat in existing_categories)
        
        # Check if new monthly budget is less than existing category budgets
        if sum_category_budgets > data.monthly_limit:
            raise HTTPException(
                status_code=400,
                detail=f"Monthly budget (₹{data.monthly_limit}) cannot be less than sum of category budgets (₹{sum_category_budgets}). Please adjust category budgets first."
            )

    budget = db.query(Budget).filter(
        Budget.user_id == user.id,
        Budget.category_id == data.category_id,
        Budget.month == data.month,
        Budget.year == data.year
    ).first()

    if budget:
        budget.monthly_limit = data.monthly_limit
    else:
        budget = Budget(user_id=user.id, **data.dict())
        db.add(budget)

    db.commit()
    db.refresh(budget)
    return budget


@router.get("/", response_model=list[BudgetResponse])
def list_budgets(
    month: int = None,
    year: int = None,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    query = db.query(Budget).filter(Budget.user_id == user.id)
    
    if month is not None:
        query = query.filter(Budget.month == month)
    if year is not None:
        query = query.filter(Budget.year == year)
    
    return query.all()


@router.delete("/{budget_id}")
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    budget = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == user.id
    ).first()
    
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    db.delete(budget)
    db.commit()
    return {"message": "Budget deleted successfully"}
