from datetime import date

from app.models.savings import MonthlySavings
from app.services.savings_detector import detect_savings
from app.services.savings_reasoning import build_savings_reasoning
from app.services.savings_allocator import recalculate_savings_allocations


def detect_and_store_savings(
	db,
	user_id: int,
	month: int,
	year: int,
	user_confirmed_amount: float | None = None
):
	result = detect_savings(
		db,
		user_id,
		month,
		year,
		user_confirmed_amount
	)

	savings_record = None
	allocations = []
	
	if result["amount_saved"] > 0:
		savings_record = db.query(MonthlySavings).filter(
			MonthlySavings.user_id == user_id,
			MonthlySavings.month == month,
			MonthlySavings.year == year
		).first()

		if savings_record:
			savings_record.amount_saved = result["amount_saved"]
			savings_record.source = result["reason"]
		else:
			savings_record = MonthlySavings(
				user_id=user_id,
				month=month,
				year=year,
				amount_saved=result["amount_saved"],
				source=result["reason"]
			)
			db.add(savings_record)

		db.commit()
		db.refresh(savings_record)

		allocations = recalculate_savings_allocations(
			db,
			savings_record,
			user_id
		)
		db.commit()
	else:
		# If savings are zero or negative, remove any existing record and allocations
		existing = db.query(MonthlySavings).filter(
			MonthlySavings.user_id == user_id,
			MonthlySavings.month == month,
			MonthlySavings.year == year
		).first()
		if existing:
			# Reset allocations tied to the existing savings record
			recalculate_savings_allocations(db, existing, user_id)
			db.delete(existing)
			db.commit()

	income, expense = (
		result.get("income", None),
		result.get("expense", None)
	)

	reasoning = build_savings_reasoning(
		month,
		year,
		income,
		expense,
		result["surplus"],
		result["amount_saved"],
		result["reason"]
	)

	return {
		"savings": result,
		"reasoning": reasoning,
		"allocations": allocations,
		"savings_record": savings_record
	}
