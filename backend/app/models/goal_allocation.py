from sqlalchemy import Column, Integer, Float, ForeignKey
from app.core.database import Base

class GoalAllocation(Base):
    __tablename__ = "goal_allocations"

    id = Column(Integer, primary_key=True)
    savings_id = Column(Integer, ForeignKey("monthly_savings.id", ondelete="CASCADE"))
    goal_id = Column(Integer, ForeignKey("goals.id", ondelete="CASCADE"))

    allocated_amount = Column(Float, nullable=False)
