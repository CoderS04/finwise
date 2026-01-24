from pydantic import BaseModel
from typing import List

class PieChartItem(BaseModel):
    category: str
    amount: float

class MonthlyTrendItem(BaseModel):
    month: str
    amount: float

class IncomeExpenseItem(BaseModel):
    income: float
    expense: float

class SavingsRateItem(BaseModel):
    savings: float
    savings_rate: float
