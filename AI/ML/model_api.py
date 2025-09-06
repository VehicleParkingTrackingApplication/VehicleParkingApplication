from flask import Flask, request, jsonify
import xgboost as xgb
import pandas as pd

# Initialize the Flask app
app = Flask(__name__)

# Load the trained model
# It's in the same directory, so the path is simple
model = xgb.XGBRegressor()
model.load_model("vehicle_forecaster.json")
print("✅ Python AI Model loaded successfully!")

@app.route('/predict', methods=['POST'])
def predict():
    input_data = request.get_json()
    timestamps = pd.to_datetime(input_data['timestamps'])
    
    # Create features for the model
    features = pd.DataFrame(index=timestamps)
    features['hour'] = features.index.hour
    features['day_of_week'] = features.index.dayofweek
    features['day_of_month'] = features.index.day
    features['month'] = features.index.month

    # Make predictions
    predictions = model.predict(features)

    # Format and return the response
    response = {
        'predictions': dict(zip(input_data['timestamps'], predictions.tolist()))
    }
    return jsonify(response)

if __name__ == '__main__':
    # Run the service on port 5001 to avoid conflict with Node.js
    app.run(host='0.0.0.0', port=5001)