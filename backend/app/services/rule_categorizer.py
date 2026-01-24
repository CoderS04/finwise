CATEGORY_RULES = {
    "food": ["zomato", "swiggy", "dominos", "restaurant", "cafe"],
    "transport": ["uber", "ola", "bus", "train", "metro"],
    "shopping": ["amazon", "flipkart", "myntra"],
    "entertainment": ["netflix", "spotify", "movie"],
    "utilities": ["electricity", "water", "gas", "bill"],
    "rent": ["rent"],
    "salary": ["salary", "payroll"],
}

def rule_based_category(description: str):
    if not description:
        return None

    desc = description.lower()

    for category, keywords in CATEGORY_RULES.items():
        for keyword in keywords:
            if keyword in desc:
                return category

    return None
