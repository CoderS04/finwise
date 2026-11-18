from app.services.rule_categorizer import rule_based_category
from app.services.ml_categorizer import ml_predict_category
# from rule_categorizer import rule_based_category
# from ml_categorizer import ml_predict_category

# CONFIDENCE_THRESHOLD = 0.6
CONFIDENCE_THRESHOLD = 0.7
# CONFIDENCE_MARGIN = 0.08

def categorize_transaction(description: str):
    # 1️⃣ Rule-based
    rule_category = rule_based_category(description)
    if rule_category:
        return rule_category, "rule"

    # 2️⃣ ML-based
    ml_category, confidence = ml_predict_category(description)
    print(f"ML Prediction: {ml_category} with confidence {confidence}")
    if confidence >= CONFIDENCE_THRESHOLD:
        return ml_category, "ml"

    # 3️⃣ Fallback
    return "Uncategorized", "fallback"
    
    # if confidence >= CONFIDENCE_THRESHOLD:
    #     return ml_category, "ml"

    # # soft accept for known categories
    # if ml_category != "uncategorized" and confidence >= 0.15:
    #     return ml_category, "ml_low_conf"

    # return "Uncategorized", "fallback"



if __name__ == "__main__":
    # desc = "Paid electricity bill via online portal"
    desc = input("Enter transaction description: ")
    category, source = categorize_transaction(desc)
    print(f"Description: {desc}")
    print(f"Category: {category} (Source: {source})")