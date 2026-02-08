from pydantic import BaseModel, computed_field
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

    @computed_field
    @property
    def deadline_exceeded(self) -> bool:
        return self.target_date < date.today() and not self.is_completed

    class Config:
        from_attributes = True
