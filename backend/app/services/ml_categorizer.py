import joblib

model = joblib.load("app/ml/category_model.pkl")
vectorizer = joblib.load("app/ml/vectorizer.pkl")

def ml_predict_category(description: str):
    if not description:
        return None, 0.0

    X = vectorizer.transform([description])
    probs = model.predict_proba(X)[0]
    confidence = max(probs)
    # sorted_probs = sorted(probs, reverse=True)
    # confidence = sorted_probs[0] - sorted_probs[1]
    category = model.classes_[probs.argmax()]

    return category, confidence
