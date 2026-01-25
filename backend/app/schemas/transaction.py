from pydantic import BaseModel, ConfigDict
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

    model_config = ConfigDict(from_attributes=True)
