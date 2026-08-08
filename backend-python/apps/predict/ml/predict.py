# apps/predict/ml/predict.py
"""
Online prediction module — loaded ONCE at Django startup (module-level load, not per-request).
Serves inference from the trained 4-model suite:
  - RandomForestClassifier  → crowd bucket prediction
  - GradientBoostingClassifier → available for comparison
  - LinearRegression → continuous crowd count
  - IsolationForest → anomaly detection
"""
import json
import numpy as np
import joblib
from pathlib import Path

from .features import build_feature_vector, BUCKET_MAP, STATIONS, is_peak_hour, is_weekend_day, normalize_station
from .explain import explain_prediction

SAVED_DIR = Path(__file__).resolve().parent / 'saved'

# ── Module-level state — loaded once on first import ─────────────
_model = None           # RandomForestClassifier
_gb_model = None        # GradientBoostingClassifier
_regression_model = None  # LinearRegression
_anomaly_model = None   # IsolationForest
_scaler = None
_feature_names = None
_station_encoder = None
_loaded_models = {
    'crowd_model': False,
    'gb_model': False,
    'regression_model': False,
    'anomaly_model': False,
}


def _load_artifacts():
    """Load all model artifacts from disk. Called once."""
    global _model, _gb_model, _regression_model, _anomaly_model
    global _scaler, _feature_names, _station_encoder, _loaded_models

    # Primary classifier (required)
    model_path = SAVED_DIR / 'model.pkl'
    scaler_path = SAVED_DIR / 'scaler.pkl'
    features_path = SAVED_DIR / 'feature_names.json'

    if not model_path.exists():
        print("[WARN] Model artifacts not found. Run 'python apps/predict/ml/train.py' first.")
        return False

    _model = joblib.load(model_path)
    _scaler = joblib.load(scaler_path)
    with open(features_path, 'r') as f:
        _feature_names = json.load(f)
    _loaded_models['crowd_model'] = True
    print("[OK] Crowd model (RandomForest) loaded")

    # GradientBoosting classifier
    gb_path = SAVED_DIR / 'gb_model.pkl'
    if gb_path.exists():
        _gb_model = joblib.load(gb_path)
        _loaded_models['gb_model'] = True
        print("[OK] GradientBoosting model loaded")

    # Regression model
    reg_path = SAVED_DIR / 'regression_model.pkl'
    if reg_path.exists():
        _regression_model = joblib.load(reg_path)
        _loaded_models['regression_model'] = True
        print("[OK] Regression model loaded")

    # Anomaly model
    anomaly_path = SAVED_DIR / 'anomaly_model.pkl'
    encoder_path = SAVED_DIR / 'station_encoder.pkl'
    if anomaly_path.exists() and encoder_path.exists():
        _anomaly_model = joblib.load(anomaly_path)
        _station_encoder = joblib.load(encoder_path)
        _loaded_models['anomaly_model'] = True
        print("[OK] Anomaly model (IsolationForest) loaded")

    return True


def is_model_loaded():
    """Check if primary model artifacts are loaded."""
    return _loaded_models['crowd_model']


def get_model_status():
    """Return per-model load status for health checks."""
    return dict(_loaded_models)


# ── 1. Crowd Bucket Prediction (existing) ────────────────────────

def run_prediction(data: dict) -> dict:
    """
    Run crowd prediction on a single input.

    Args:
        data: {station, hour, day, passengers}

    Returns:
        {bucket, confidence, score, top_features}
    """
    if not _loaded_models['crowd_model']:
        if not _load_artifacts():
            return {
                'bucket': 'Medium',
                'confidence': 50.0,
                'score': 0.5,
                'top_features': [],
                'error': 'Model not trained yet',
            }

    # Build feature vector in the exact same column order as training
    features_df = build_feature_vector(data)

    # Ensure columns match training order
    for col in _feature_names:
        if col not in features_df.columns:
            features_df[col] = 0.0
    features_df = features_df[_feature_names]

    # Scale and predict
    X_scaled = _scaler.transform(features_df.values)
    bucket_idx = _model.predict(X_scaled)[0]
    proba = _model.predict_proba(X_scaled)[0]

    # Top-3 features by importance (explainability payload)
    importances = _model.feature_importances_
    top_indices = np.argsort(importances)[-3:][::-1]
    top_features = [
        {'name': _feature_names[i], 'importance': round(float(importances[i]), 4)}
        for i in top_indices
    ]

    # SHAP local explanation
    shap_explanation = explain_prediction(X_scaled, _feature_names)

    return {
        'bucket': BUCKET_MAP[int(bucket_idx)],
        'confidence': round(float(max(proba)) * 100, 1),
        'score': round(float(proba[int(bucket_idx)]), 4),
        'top_features': top_features,
        'shap_explanation': shap_explanation,
    }


# ── 2. Anomaly Detection ─────────────────────────────────────────

def run_anomaly_check(station: str, hour: int, day_of_week: int, actual_or_predicted_crowd: int) -> dict:
    """
    Check whether a crowd reading is anomalous using the trained IsolationForest.

    Args:
        station: Station name
        hour: Hour of day (0-23)
        day_of_week: Day of week (0=Mon, 6=Sun)
        actual_or_predicted_crowd: The crowd value to evaluate

    Returns:
        {isAnomaly: bool, anomalyScore: float, message: str}
    """
    station = normalize_station(station)
    if not _loaded_models['anomaly_model']:
        return {
            'isAnomaly': False,
            'anomalyScore': 0.0,
            'message': 'Anomaly model not loaded — run train.py first',
        }

    # Encode station (handle unseen stations gracefully)
    try:
        station_idx = _station_encoder.transform([station])[0]
    except ValueError:
        # Unknown station — can't evaluate, return safe default
        return {
            'isAnomaly': False,
            'anomalyScore': 0.0,
            'message': f'Unknown station "{station}" — not in training data',
        }

    # Build the 4-feature vector: [hour, day_of_week, station_encoded, crowd]
    X = np.array([[hour, day_of_week, station_idx, actual_or_predicted_crowd]])

    # IsolationForest decision_function: negative = more anomalous
    anomaly_score = float(_anomaly_model.decision_function(X)[0])
    prediction = int(_anomaly_model.predict(X)[0])  # -1 = anomaly, 1 = normal

    is_anomaly = prediction == -1

    if is_anomaly:
        message = (
            f'Unusual crowd level detected at {station} '
            f'(hour={hour}, day={day_of_week}, crowd={actual_or_predicted_crowd}). '
            f'Anomaly score: {anomaly_score:.4f}'
        )
    else:
        message = (
            f'Crowd level at {station} is within normal range '
            f'(score: {anomaly_score:.4f})'
        )

    return {
        'isAnomaly': is_anomaly,
        'anomalyScore': round(anomaly_score, 4),
        'message': message,
    }


# ── 3. Personality Analysis ──────────────────────────────────────

def run_personality_analysis(ticket_history: list) -> dict:
    """
    Classify a user's commuter personality based on their trip history.

    Args:
        ticket_history: list of dicts, each with {hour, day, station, crowdBucket}

    Returns:
        {personality: str, description: str, ratios: dict, totalTrips: int}
    """
    if not ticket_history:
        return {
            'personality': 'Balanced Traveler',
            'description': 'Not enough trip data to determine your personality.',
            'ratios': {},
            'totalTrips': 0,
        }

    total = len(ticket_history)

    # ── Compute ratios ───────────────────────────────────────────
    early_count = sum(1 for t in ticket_history if int(t.get('hour', 12)) < 9)
    peak_count = sum(1 for t in ticket_history if is_peak_hour(int(t.get('hour', 12))))
    weekend_count = sum(1 for t in ticket_history if is_weekend_day(int(t.get('day', 0))))

    high_crowd = sum(1 for t in ticket_history if t.get('crowdBucket', '').lower() == 'high')
    low_crowd = sum(1 for t in ticket_history if t.get('crowdBucket', '').lower() == 'low')

    unique_stations = len(set(t.get('station', '') for t in ticket_history))

    ratios = {
        'earlyMorningRatio': round(early_count / total, 4),
        'peakHourRatio': round(peak_count / total, 4),
        'weekendRatio': round(weekend_count / total, 4),
        'highCrowdRatio': round(high_crowd / total, 4),
        'lowCrowdRatio': round(low_crowd / total, 4),
        'uniqueStations': unique_stations,
        'uniqueStationRatio': round(unique_stations / len(STATIONS), 4),
    }

    # ── Rule-based classification ────────────────────────────────
    early_ratio = ratios['earlyMorningRatio']
    peak_ratio = ratios['peakHourRatio']
    weekend_ratio = ratios['weekendRatio']
    high_ratio = ratios['highCrowdRatio']
    low_ratio = ratios['lowCrowdRatio']

    if early_ratio >= 0.50:
        personality = 'Early Bird'
        description = (
            'You consistently travel before 9 AM — beating the rush and '
            'enjoying quieter commutes. Your mornings are your superpower!'
        )
    elif peak_ratio >= 0.50 and high_ratio >= 0.40:
        personality = 'Rush Hour Warrior'
        description = (
            'You brave the busiest hours and the most crowded trains. '
            'Nothing slows you down — you thrive in the chaos of peak commute.'
        )
    elif weekend_ratio >= 0.50:
        personality = 'Weekend Explorer'
        description = (
            'Your metro usage peaks on weekends — you\'re out exploring the city '
            'when others are resting. Adventure is your middle name!'
        )
    elif low_ratio >= 0.50 and unique_stations >= 5:
        personality = 'Smart Commuter'
        description = (
            'You strategically pick low-crowd times and explore many stations. '
            'You\'ve cracked the code to a stress-free commute.'
        )
    else:
        personality = 'Balanced Traveler'
        description = (
            'You have a well-rounded travel pattern — mixing peak and off-peak, '
            'weekdays and weekends. The metro is your reliable companion.'
        )

    return {
        'personality': personality,
        'description': description,
        'ratios': ratios,
        'totalTrips': total,
    }


# ── 4. Best Departure Recommendation ─────────────────────────────

def run_best_departure(station: str, target_hour: int, day_of_week: int) -> dict:
    """
    Compare predictions for target_hour ± 1 and recommend the least crowded option.

    Args:
        station: Station name
        target_hour: User's intended departure hour
        day_of_week: Day of week (0=Mon, 6=Sun)

    Returns:
        {
            bestHour, bestBucket, bestConfidence,
            options: [{hour, bucket, confidence, crowdScore}],
            recommendation: str
        }
    """
    station = normalize_station(station)
    
    from datetime import datetime
    now = datetime.now()
    
    # If it's today and target_hour - 1 is in the past, shift the 3-hour window forward
    if day_of_week == now.weekday() and (target_hour - 1) < now.hour:
        base_hours = [max(target_hour, now.hour), max(target_hour, now.hour) + 1, max(target_hour, now.hour) + 2]
    else:
        base_hours = [target_hour - 1, target_hour, target_hour + 1]
        
    candidate_hours = sorted(set(
        max(6, min(22, h)) for h in base_hours
    ))
    
    # Final safety: strictly remove any past hours for today
    if day_of_week == now.weekday():
        candidate_hours = [h for h in candidate_hours if h >= now.hour]
        
    # Fallback if no valid hours (e.g. after 22:00)
    if not candidate_hours:
        candidate_hours = [max(6, min(22, target_hour))]

    options = []
    bucket_score_map = {'Low': 1, 'Medium': 2, 'High': 3}

    for hour in candidate_hours:
        result = run_prediction({
            'station': station,
            'hour': hour,
            'day': day_of_week,
            'passengers': 1,
        })

        crowd_score = bucket_score_map.get(result['bucket'], 2)
        # Weight by inverse confidence: lower crowd + higher confidence = better
        weighted_score = crowd_score - (result['confidence'] / 100.0) * 0.5

        options.append({
            'hour': hour,
            'bucket': result['bucket'],
            'confidence': result['confidence'],
            'crowdScore': round(weighted_score, 4),
        })

    # Sort by weighted crowd score (lower is better)
    options.sort(key=lambda x: x['crowdScore'])
    best = options[0]

    # Find the user's original hour in options
    target_option = next((o for o in options if o['hour'] == target_hour), options[-1])

    # Compute delta: how much better is the recommendation vs. the user's choice
    if target_option['crowdScore'] > 0 and best['hour'] != target_hour:
        delta_pct = round(
            (target_option['crowdScore'] - best['crowdScore']) / target_option['crowdScore'] * 100,
            1,
        )
        recommendation = (
            f"Depart at {best['hour']}:00 instead of {target_hour}:00 — "
            f"predicted {delta_pct}% less crowded ({best['bucket']} vs {target_option['bucket']})"
        )
    else:
        delta_pct = 0.0
        recommendation = (
            f"Your chosen time ({target_hour}:00) is already the best option — "
            f"predicted {best['bucket']} crowd with {best['confidence']}% confidence"
        )

    return {
        'bestHour': best['hour'],
        'bestBucket': best['bucket'],
        'bestConfidence': best['confidence'],
        'deltaPct': delta_pct,
        'options': options,
        'recommendation': recommendation,
    }


# Auto-load on import
_load_artifacts()
