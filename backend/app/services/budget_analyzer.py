def analyze_budget(spent, limit):
    if limit <= 0:
        return "no_budget", 0

    ratio = spent / limit

    if ratio < 0.7:
        return "healthy", ratio
    elif ratio < 0.9:
        return "warning", ratio
    else:
        return "overspent", ratio
