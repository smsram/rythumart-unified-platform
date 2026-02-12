import sys
import json
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from datetime import datetime, timedelta
import warnings

# Suppress sklearn warnings about feature names
warnings.filterwarnings("ignore")

def read_input():
    try:
        # Read JSON from Node.js stdin
        lines = sys.stdin.readlines()
        if not lines:
            return {}
        return json.loads(lines[0])
    except:
        return {}

def create_features(df):
    """
    Adds cyclical features so the model understands seasonality (Sine/Cosine waves).
    This prevents the 'flat line' prediction issue.
    """
    # Create Day of Year (1-365)
    df['day_of_year'] = df['date'].dt.dayofyear
    
    # Transform into cyclical features (Sine/Cosine)
    # This helps the model know that Day 365 is close to Day 1
    df['sin_date'] = np.sin(2 * np.pi * df['day_of_year'] / 365)
    df['cos_date'] = np.cos(2 * np.pi * df['day_of_year'] / 365)
    
    # We remove the actual date/price columns for training X
    return df[['sin_date', 'cos_date']]

def generate_yearly_data(base_price):
    """
    Generates 365 days of synthetic history ending exactly at 'base_price'.
    """
    days = 365
    today = datetime.now()
    date_range = [today - timedelta(days=i) for i in range(days-1, -1, -1)]
    
    # 1. Create a Time Series Index (0 to 364)
    t = np.arange(days)
    
    # 2. Seasonality: Sine wave (Market ups and downs)
    # Period = 180 days (2 cycles/year)
    seasonality = np.sin(2 * np.pi * t / 180) 
    
    # 3. Trend: Slight inflation over the year
    trend = np.linspace(0.8, 1.0, days) 
    
    # 4. Noise: Random daily fluctuations
    noise = np.random.normal(0, 0.05, days) # 5% volatility
    
    # Combine patterns
    raw_signal = (seasonality * 0.2) + trend + noise
    
    # Scale so the LAST point (Today) matches the requested current price
    scaling_factor = base_price / raw_signal[-1]
    final_prices = raw_signal * scaling_factor
    
    # Create DataFrame
    df = pd.DataFrame({
        'date': date_range,
        'price': final_prices.astype(int)
    })
    
    return df

def analyze_market(current_price):
    # 1. Generate 1 Year of Synthetic Data (The "Training Set")
    df = generate_yearly_data(current_price)
    
    # 2. Prepare Training Features
    X_train = create_features(df.copy())
    y_train = df['price']
    
    # 3. Train Random Forest (Uses cyclical features now)
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    # --- PREPARE HISTORY (Last 7 Days) ---
    # We take the actual generated data from the tail of our dataframe
    history_slice = df.tail(7).copy()
    history_output = []
    
    for _, row in history_slice.iterrows():
        history_output.append({
            "day": row['date'].strftime("%a"),      # "Mon"
            "date": row['date'].strftime("%d %b"),  # "12 Feb"
            "price": int(row['price'])
        })

    # --- PREPARE FORECAST (Next 7 Days) ---
    future_dates = [datetime.now() + timedelta(days=i) for i in range(1, 8)]
    future_df = pd.DataFrame({'date': future_dates})
    
    # Generate features for future dates (Sine/Cosine)
    X_future = create_features(future_df.copy())
    
    # Predict using the DataFrame (fixes the "valid feature names" warning)
    predictions = model.predict(X_future)
    
    forecast_output = []
    for i, price in enumerate(predictions):
        forecast_output.append({
            "day": future_dates[i].strftime("%a"),
            "date": future_dates[i].strftime("%d %b"),
            "price": int(price)
        })
        
    return {
        "history": history_output,
        "forecast": forecast_output
    }

if __name__ == "__main__":
    try:
        # 1. Read Input
        input_data = read_input()
        current_price = float(input_data.get('currentPrice', 2000))
        
        # 2. Run Analysis
        result = analyze_market(current_price)
        
        # 3. Print JSON Result
        print(json.dumps(result))
        
    except Exception as e:
        # Fallback if Python fails
        fallback = {"error": str(e), "history": [], "forecast": []}
        print(json.dumps(fallback))