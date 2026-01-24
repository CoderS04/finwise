from sqlalchemy import func
from app.models.transaction import Transaction

def average(values):
    return sum(values) / len(values) if values else 0

def variance(values):
    avg = average(values)
    return sum((x - avg) ** 2 for x in values) / len(values) if values else 0

def calculate_buffer(avg, var):
    if avg == 0:
        return 0.2

    ratio = var / avg

    if ratio < 0.1:
        return 0.05
    elif ratio < 0.3:
        return 0.1
    else:
        return 0.15

def suggest_budget(history):
    avg = average(history)
    var = variance(history)
    buffer = calculate_buffer(avg, var)

    return round(avg * (1 + buffer), 2), {
        "average_spend": avg,
        "buffer_percent": int(buffer * 100)
    }
