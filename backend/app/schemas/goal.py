from pydantic import BaseModel
from datetime import date

class GoalCreate(BaseModel):
    name: str
    goal_type: str
    priority: str
    target_amount: float
    target_date: date

class Goal(BaseModel):
    id: int
    user_id: int
    name: str
    goal_type: str
    priority: str
    target_amount: float
    current_amount: float
    target_date: date
    is_completed: bool

    class Config:
        from_attributes = True
