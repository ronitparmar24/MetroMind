# apps/predict/ml/features.py
"""
Feature engineering functions for the crowd prediction model.
Transforms raw booking data into ML-ready features.
"""
import pandas as pd
import numpy as np


# GMRC stations for one-hot encoding
STATIONS = [
    'Motera Stadium', 'Sabarmati', 'Ranip', 'Kankaria East',
    'Kalupur Railway Station', 'Gheekanta', 'Old High Court',
    'Shahpur', 'Vadaj', 'Thaltej', 'Doordarshan Kendra',
    'Gujarat University', 'Commerce Six Roads', 'SSG Hospital',
    'AEC', 'Paldi', 'Shreyas', 'Amraiwadi', 'Rabari Colony',
    'Apparel Park', 'APMC', 'Vastral Gam', 'Nirant Cross Road',
    'Vastral', 'Odhav', 'CTM Cross Road', 'Jivraj Mehta Hospital',
    'Kankaria', 'Kalupur', 'Usmanpura', 'Chandkheda', 'GNLU',
]

BUCKET_MAP = {0: 'Low', 1: 'Medium', 2: 'High'}
REVERSE_BUCKET_MAP = {'Low': 0, 'Medium': 1, 'High': 2}


def is_peak_hour(hour):
    """Peak windows: 8-11 AM and 5-8 PM on weekdays."""
    return (8 <= hour < 11) or (17 <= hour < 20)


def is_weekend_day(day_of_week):
    """Saturday (5) and Sunday (6) are weekends."""
    return day_of_week >= 5


def engineer_features(df):
    """
    Transform raw dataframe into feature matrix for ML model.
    
    Input columns: station, hour, day_of_week, passengers
    Output: feature matrix with one-hot encoded stations + numeric features
    """
    features = pd.DataFrame()
    
    # Numeric features
    features['hour'] = df['hour'].astype(float)
    features['day_of_week'] = df['day_of_week'].astype(float)
    features['passengers'] = df['passengers'].astype(float)
    features['is_peak'] = df['hour'].apply(lambda h: 1.0 if is_peak_hour(h) else 0.0)
    features['is_weekend'] = df['day_of_week'].apply(lambda d: 1.0 if is_weekend_day(d) else 0.0)
    
    # Derived features
    features['hour_sin'] = np.sin(2 * np.pi * df['hour'] / 24)
    features['hour_cos'] = np.cos(2 * np.pi * df['hour'] / 24)
    
    # One-hot encode stations
    for station in STATIONS:
        features[f'station_{station}'] = (df['station'] == station).astype(float)
    
    return features


def build_feature_vector(data: dict) -> pd.DataFrame:
    """
    Build a single feature vector from a prediction request.
    Must produce the exact same columns in the exact same order as training.
    
    Args:
        data: {station, hour, day, passengers}
    """
    row = pd.DataFrame([{
        'station': data['station'],
        'hour': int(data['hour']),
        'day_of_week': int(data['day']),
        'passengers': int(data.get('passengers', 1)),
    }])
    return engineer_features(row)


def bucket_crowd(actual_crowd):
    """
    Bucket raw crowd count into Low/Medium/High.
    Low: 0-50, Medium: 51-150, High: 151+
    """
    if actual_crowd <= 50:
        return 'Low'
    elif actual_crowd <= 150:
        return 'Medium'
    else:
        return 'High'
