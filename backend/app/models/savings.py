from sqlalchemy import Column, Integer, Float, ForeignKey, Date, String, UniqueConstraint
from app.core.database import Base

class MonthlySavings(Base):
    __tablename__ = "monthly_savings"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    month = Column(Integer)
    year = Column(Integer)

    amount_saved = Column(Float, nullable=False)
    source = Column(String)

    __table_args__ = (
        UniqueConstraint("user_id", "month", "year", name="unique_user_month"),
    )
