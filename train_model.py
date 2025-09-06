# train_model.py
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import pickle

# Load dataset
df = pd.read_csv("ambiguous_landslide_dataset.csv")
df = df.rename(columns={"Landslide": "Rockfall"})

# Split features and target
X = df.drop(columns=["Rockfall"])
y = df["Rockfall"]

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Train Random Forest
rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
rf_model.fit(X_train, y_train)

# Save trained model & feature names
with open("rockfall_model.pkl", "wb") as f:
    pickle.dump((rf_model, X.columns.tolist()), f)

print("✅ Model trained and saved as rockfall_model.pkl")
