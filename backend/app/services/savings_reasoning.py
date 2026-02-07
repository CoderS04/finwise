def build_savings_reasoning(
    month,
    year,
    income,
    expense,
    surplus,
    saved,
    reason
):
    return {
        "month": month,
        "year": year,
        "income": income,
        "expense": expense,
        "surplus": surplus,
        "saved": saved,
        "decision": reason,
        "logic": (
            "Savings derived from monthly surplus. "
            "Goals are allocated only from confirmed savings."
        )
    }
