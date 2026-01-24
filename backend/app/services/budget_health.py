def calculate_health_score(ratio):
    score = 100 - int(ratio * 100)
    return max(0, min(100, score))
