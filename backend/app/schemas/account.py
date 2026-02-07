from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AccountBase(BaseModel):
    account_name: str
    account_type: Optional[str] = None
    currency: Optional[str] = "INR"
    balance: Optional[float] = 0.0


class AccountCreate(AccountBase):
    pass


class AccountUpdate(BaseModel):
    account_name: Optional[str] = None
    account_type: Optional[str] = None
    currency: Optional[str] = None
    balance: Optional[float] = None


class AccountResponse(AccountBase):
    id: int
    balance: float
    created_at: datetime

    class Config:
        from_attributes = True
