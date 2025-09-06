# app.py
from flask import Flask, request, jsonify
import pickle
import pandas as pd

# Load model
with open("rockfall_model.pkl", "rb") as f:
    model, feature_names = pickle.load(f)

app = Flask(__name__)

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json  # Expecting JSON input from Node.js
    
    # Convert input to DataFrame
    user_data = pd.DataFrame([data], columns=feature_names)
    
    # Make prediction
    prediction = model.predict(user_data)[0]
    probability = model.predict_proba(user_data)[0][1]
    
    return jsonify({
        "prediction": int(prediction),
        "probability": round(float(probability), 4)
    })

if __name__ == "__main__":
    app.run(debug=True, port=5000)
