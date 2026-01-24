import pandas as pd
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

# df = pd.read_csv("./data/training_data.csv")
df = pd.read_csv("app/data/training_data.csv")

X = df["description"]
y = df["category"]

vectorizer = TfidfVectorizer()
X_vec = vectorizer.fit_transform(X)

model = LogisticRegression()
model.fit(X_vec, y)

joblib.dump(model, "app/ml/category_model.pkl")
joblib.dump(vectorizer, "app/ml/vectorizer.pkl")