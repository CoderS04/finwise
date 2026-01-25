from pydantic import BaseModel
from typing import Optional

class BudgetCreate(BaseModel):
    category_id: Optional[int] = None
    monthly_limit: float
    month: int
    year: int

class BudgetResponse(BudgetCreate):
    id: int

    class Config:
        from_attributes = True
