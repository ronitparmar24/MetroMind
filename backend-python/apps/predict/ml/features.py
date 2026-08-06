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

# Mapping from frontend/user-facing station names → ML dataset canonical names
# Add entries here whenever a station name changes in the UI or dataset
STATION_ALIASES = {
    # Thaltej Gam is a separate station in the frontend but the ML dataset
    # only contains the simplified 'Thaltej' entry — map it to the nearest match
    'Thaltej Gam': 'Thaltej',
    # Frontend uses singular 'Road'; dataset uses plural 'Roads'
    'Commerce Six Road': 'Commerce Six Roads',
    # Frontend uses full name; dataset uses short name
    'Kalupur Metro Station': 'Kalupur',
    'Sabarmati Railway Station': 'Sabarmati',
    # Common abbreviation variants
    'Jivraj Park': 'Jivraj Mehta Hospital',
    'Kankaria East': 'Kankaria East',  # already correct, kept for explicitness
}

BUCKET_MAP = {0: 'Low', 1: 'Medium', 2: 'High'}
REVERSE_BUCKET_MAP = {'Low': 0, 'Medium': 1, 'High': 2}


def normalize_station(name: str) -> str:
    """
    Normalise a user-supplied station name to its canonical ML dataset name.
    Handles:
      - Direct alias lookups (e.g. 'Thaltej Gam' → 'Thaltej')
      - Case-insensitive fallback matching against the STATIONS list
    Returns the original name unchanged if no match is found (so the caller
    can surface a meaningful error rather than crashing silently).
    """
    # 1. Exact alias match
    if name in STATION_ALIASES:
        return STATION_ALIASES[name]
    # 2. Already a known canonical name
    if name in STATIONS:
        return name
    # 3. Case-insensitive alias lookup
    lower = name.lower()
    for alias, canonical in STATION_ALIASES.items():
        if alias.lower() == lower:
            return canonical
    # 4. Case-insensitive canonical lookup
    for s in STATIONS:
        if s.lower() == lower:
            return s
    # 5. Not found — return as-is and let the caller handle the error
    return name


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
        'station': normalize_station(data['station']),
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
