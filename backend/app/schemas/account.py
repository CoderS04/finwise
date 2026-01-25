from pydantic import BaseModel, ConfigDict
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

    model_config = ConfigDict(from_attributes=True)

    class Config:
        orm_mode = True
