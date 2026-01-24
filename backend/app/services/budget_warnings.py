def generate_warning(status, category_name=None):
    label = category_name or "monthly"

    if status == "warning":
        return f"You are close to exceeding your {label} budget."
    if status == "overspent":
        return f"You have exceeded your {label} budget."

    return None
