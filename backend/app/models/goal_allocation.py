from sqlalchemy import Column, Integer, Float, ForeignKey
from app.core.database import Base

class GoalAllocation(Base):
    __tablename__ = "goal_allocations"

    id = Column(Integer, primary_key=True)
    savings_id = Column(Integer, ForeignKey("monthly_savings.id"))
    goal_id = Column(Integer, ForeignKey("goals.id"))

    allocated_amount = Column(Float, nullable=False)
