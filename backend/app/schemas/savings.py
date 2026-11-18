from pydantic import BaseModel

class SavingsCreate(BaseModel):
    month: int
    year: int
    amount_saved: float
