from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime


class AccountBase(BaseModel):
    account_name: str
    account_type: Optional[str] = None
    currency: Optional[str] = "INR"


class AccountCreate(AccountBase):
    initial_balance: float = 0.0
    
    @field_validator('initial_balance')
    @classmethod
    def validate_initial_balance(cls, v):
        if v < 0:
            raise ValueError('Initial balance cannot be negative')
        return v


class AccountUpdate(BaseModel):
    account_name: Optional[str] = None
    account_type: Optional[str] = None
    currency: Optional[str] = None
    balance: Optional[float] = None


class AccountResponse(AccountBase):
    id: int
    balance: float

    class Config:
        from_attributes = True
    balance: float
    created_at: datetime

    class Config:
        from_attributes = True
