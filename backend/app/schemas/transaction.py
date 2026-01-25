from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class TransactionCreate(BaseModel):
    account_id: int
    amount: float
    transaction_type: str  # income / expense
    description: Optional[str]
    transaction_date: datetime
    category_id: Optional[int] = None

class TransactionResponse(TransactionCreate):
    id: int

    class Config:
        from_attributes = True
