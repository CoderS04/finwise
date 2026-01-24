from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    account_name = Column(String, nullable=False)
    account_type = Column(String)
    currency = Column(String, default="INR")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
