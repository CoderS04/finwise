from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from datetime import datetime
from app.core.database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    account_id = Column(Integer, ForeignKey("accounts.id"))
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)

    amount = Column(Float, nullable=False)
    transaction_type = Column(String)  # income / expense
    description = Column(String)
    transaction_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
