# apps/predict/ml/evaluate.py
"""
Model evaluation script — prints confusion matrix, F1, R² reports.
Usage: python apps/predict/ml/evaluate.py
"""
import sys
import json
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.metrics import classification_report, confusion_matrix, r2_score
from sklearn.preprocessing import StandardScaler
import joblib

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from apps.predict.ml.features import engineer_features, REVERSE_BUCKET_MAP  # pyrefly: ignore [missing-import]

SAVED_DIR = SCRIPT_DIR / 'saved'
DATA_PATH = PROJECT_ROOT / 'data' / 'raw' / 'ahmedabad_metro_bookings.csv'


def evaluate():
    print("=" * 60)
    print("[EVAL] MetroMind ML - Model Evaluation")
    print("=" * 60)
    
    # Load data
    df = pd.read_csv(DATA_PATH)
    X = engineer_features(df)
    y = df['bucket'].map(REVERSE_BUCKET_MAP)
    
    # Load model + scaler
    model = joblib.load(SAVED_DIR / 'model.pkl')
    scaler = joblib.load(SAVED_DIR / 'scaler.pkl')
    
    with open(SAVED_DIR / 'feature_names.json', 'r') as f:
        feature_names = json.load(f)
    
    # Align columns
    for col in feature_names:
        if col not in X.columns:
            X[col] = 0.0
    X = X[feature_names]
    
    X_scaled = scaler.transform(X.values)
    y_pred = model.predict(X_scaled)
    
    print("\n[REPORT] Classification Report (Full Dataset):")
    print(classification_report(y, y_pred, target_names=['Low', 'Medium', 'High']))
    
    print("[MATRIX] Confusion Matrix:")
    print(confusion_matrix(y, y_pred))
    
    print("\n[FEATURES] Top 10 Feature Importances:")
    importances = model.feature_importances_
    top_idx = np.argsort(importances)[-10:][::-1]
    for i in top_idx:
        print(f"   {feature_names[i]:30s} {importances[i]:.4f}")
    
    print("\n" + "=" * 60)


if __name__ == '__main__':
    evaluate()
