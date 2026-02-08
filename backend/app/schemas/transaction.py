from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional
from enum import Enum

class TransactionType(str, Enum):
    income = "income"
    expense = "expense"

class TransactionCreate(BaseModel):
    account_id: int
    amount: float
    transaction_type: TransactionType
    description: Optional[str]
    transaction_date: datetime
    category_id: Optional[int] = None
    
    @field_validator('amount')
    @classmethod
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Amount must be greater than zero')
        return v

class TransactionResponse(BaseModel):
    id: int
    account_id: int
    amount: float
    transaction_type: TransactionType
    description: Optional[str]
    transaction_date: datetime
    category_id: Optional[int] = None

    class Config:
        from_attributes = True
