from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AccountBase(BaseModel):
    account_name: str
    account_type: Optional[str] = None
    currency: Optional[str] = "INR"


class AccountCreate(AccountBase):
    pass


class AccountUpdate(BaseModel):
    account_name: Optional[str] = None
    account_type: Optional[str] = None
    currency: Optional[str] = None


class AccountResponse(AccountBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
