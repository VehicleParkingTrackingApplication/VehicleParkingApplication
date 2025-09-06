from flask import Flask, request, jsonify
from flask_cors import CORS  
import xgboost as xgb
import pandas as pd

# Initialize the Flask app
app = Flask(__name__)

# Initialize CORS for the entire app
CORS(app)                     

# Load the trained model
model = xgb.XGBRegressor()
model.load_model("vehicle_forecaster.json")
print("✅ Python AI Model loaded successfully!")

@app.route('/predict', methods=['POST'])
def predict():
    # ... your existing prediction code ...
    input_data = request.get_json()
    timestamps = pd.to_datetime(input_data['timestamps'])
    
    features = pd.DataFrame(index=timestamps)
    features['hour'] = features.index.hour
    features['day_of_week'] = features.index.dayofweek
    features['day_of_month'] = features.index.day
    features['month'] = features.index.month

    predictions = model.predict(features)

    response = {
        'predictions': dict(zip(input_data['timestamps'], predictions.tolist()))
    }
    return jsonify(response)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)