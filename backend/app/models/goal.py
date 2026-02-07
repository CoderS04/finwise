from sqlalchemy import Column, Integer, Float, String, Date, ForeignKey, Boolean
from app.core.database import Base

class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    name = Column(String, nullable=False)
    goal_type = Column(String)  # savings, travel, emergency, purchase
    priority = Column(String)   # high, medium, low

    target_amount = Column(Float, nullable=False)
    current_amount = Column(Float, default=0)

    target_date = Column(Date, nullable=False)
    is_completed = Column(Boolean, default=False)
