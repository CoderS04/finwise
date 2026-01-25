from pydantic import BaseModel, ConfigDict
from typing import Optional

class BudgetCreate(BaseModel):
    category_id: Optional[int] = None
    monthly_limit: float
    month: int
    year: int

class BudgetResponse(BudgetCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)
