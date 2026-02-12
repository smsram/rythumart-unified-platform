# /agriflow-backend/ai_engine.py

import sys
import json
import random

# 1. Get Inputs from Node.js
# sys.argv[0] is the script name, [1] is cropName, [2] is location
crop_name = sys.argv[1] if len(sys.argv) > 1 else "Unknown"
location = sys.argv[2] if len(sys.argv) > 2 else "Unknown"

# 2. Simulate AI Logic (Price Prediction / Trend Analysis)
# In a real app, you would load your .pkl model here
base_price = random.randint(2000, 5000)
predicted_price = base_price + random.randint(100, 500)
confidence = random.randint(85, 99)
trend = "UP" if predicted_price > base_price else "DOWN"

# 3. Create JSON Result
result = {
    "crop": crop_name,
    "location": location,
    "current_price": base_price,
    "predicted_price": predicted_price,
    "trend": trend,
    "confidence_score": f"{confidence}%",
    "advisory": f"Prices for {crop_name} are trending {trend}. Best time to sell is in 3 days."
}

# 4. Print JSON (This is what Node.js reads)
print(json.dumps(result))