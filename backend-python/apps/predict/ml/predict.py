# apps/predict/ml/predict.py
"""
Online prediction module — loaded ONCE at Django startup (module-level load, not per-request).
Serves inference from the trained RandomForestClassifier.
"""
import json
import numpy as np
import joblib
from pathlib import Path

from .features import build_feature_vector, BUCKET_MAP

SAVED_DIR = Path(__file__).resolve().parent / 'saved'

# Module-level load — artifacts loaded once when this module is first imported.
# Subsequent imports reuse the cached module (Python's import system handles this).
_model = None
_scaler = None
_feature_names = None
_loaded = False


def _load_artifacts():
    """Load model artifacts from disk. Called once."""
    global _model, _scaler, _feature_names, _loaded
    
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
    
    _loaded = True
    print("[OK] ML model loaded successfully")
    return True


def is_model_loaded():
    """Check if model artifacts are loaded."""
    return _loaded


def run_prediction(data: dict) -> dict:
    """
    Run crowd prediction on a single input.
    
    Args:
        data: {station, hour, day, passengers}
    
    Returns:
        {bucket, confidence, score, top_features}
    """
    if not _loaded:
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
    
    return {
        'bucket': BUCKET_MAP[int(bucket_idx)],
        'confidence': round(float(max(proba)) * 100, 1),
        'score': round(float(proba[int(bucket_idx)]), 4),
        'top_features': top_features,
    }


# Auto-load on import
_load_artifacts()
