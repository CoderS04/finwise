from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.goal import Goal
from app.schemas.goal import GoalCreate

router = APIRouter(prefix="/goals", tags=["Goals"])

@router.get("/")
def get_goals(
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    goals = db.query(Goal).filter(Goal.user_id == user.id).all()
    return goals

@router.post("/")
def create_goal(
    data: GoalCreate,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    # Validate target amount is positive
    if data.target_amount <= 0:
        raise HTTPException(
            status_code=400,
            detail="Target amount must be greater than zero"
        )
    
    # Validate target date is in the future
    from datetime import date
    if data.target_date <= date.today():
        raise HTTPException(
            status_code=400,
            detail="Target date must be in the future"
        )
    
    goal = Goal(user_id=user.id, **data.dict())
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal

@router.delete("/{goal_id}")
def delete_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    goal = db.query(Goal).filter(
        Goal.id == goal_id,
        Goal.user_id == user.id
    ).first()
    
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    db.delete(goal)
    db.commit()
    return {"message": "Goal deleted successfully"}
