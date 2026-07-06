#!/usr/bin/env python
"""
apps/predict/ml/train.py
Run once (CLI) before first server start to train and save ML model artifacts.

Usage:
    python apps/predict/ml/train.py

This script:
1. Loads/generates the training dataset
2. Engineers features
3. Trains a RandomForestClassifier (production) + LinearRegression (comparison)
4. Saves model.pkl, scaler.pkl, feature_names.json to saved/
"""
import os
import sys
import json
import random
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, r2_score
import joblib

# Add project root to path so we can import features
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from apps.predict.ml.features import (
    engineer_features, bucket_crowd, STATIONS,
    REVERSE_BUCKET_MAP, is_peak_hour, is_weekend_day,
)

SAVED_DIR = SCRIPT_DIR / 'saved'
DATA_DIR = PROJECT_ROOT / 'data' / 'raw'
CSV_PATH = DATA_DIR / 'ahmedabad_metro_bookings.csv'


def generate_dataset(n_rows=500):
    """
    Simulate ~500 rows of metro booking data if no real data exists.
    Generates realistic patterns: more passengers during peak hours,
    higher crowd at major interchange stations, etc.
    """
    random.seed(42)
    np.random.seed(42)

    # Major stations have higher base crowd
    station_weights = {s: random.uniform(0.3, 1.0) for s in STATIONS}
    # Interchange stations get higher weight
    for s in ['Kalupur Railway Station', 'Old High Court', 'Sabarmati', 'Paldi', 'Kankaria']:
        if s in station_weights:
            station_weights[s] = min(station_weights[s] * 1.5, 1.0)

    rows = []
    for _ in range(n_rows):
        station = random.choice(STATIONS)
        hour = random.randint(6, 22)  # Metro operates 6am-10pm
        day = random.randint(0, 6)
        passengers = random.randint(1, 6)

        peak = is_peak_hour(hour)
        weekend = is_weekend_day(day)

        # Simulate crowd based on station importance, time, and randomness
        base = station_weights[station] * 200
        if peak:
            base *= 1.5
        if weekend:
            base *= 0.7
        # Add noise
        actual_crowd = max(5, int(base + random.gauss(0, 30)))

        rows.append({
            'station': station,
            'hour': hour,
            'day_of_week': day,
            'passengers': passengers,
            'is_peak': peak,
            'is_weekend': weekend,
            'actual_crowd': actual_crowd,
        })

    df = pd.DataFrame(rows)
    df['bucket'] = df['actual_crowd'].apply(bucket_crowd)
    return df


def train_model():
    """Train and save all ML model artifacts."""
    print("=" * 60)
    print("[METRO] MetroMind ML Pipeline - Training")
    print("=" * 60)

    # Load or generate dataset
    if CSV_PATH.exists():
        print(f"[DATA] Loading dataset from {CSV_PATH}")
        df = pd.read_csv(CSV_PATH)
        if 'bucket' not in df.columns:
            df['bucket'] = df['actual_crowd'].apply(bucket_crowd)
    else:
        print("[DATA] No dataset found - generating simulated data (500 rows)")
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        df = generate_dataset(500)
        df.to_csv(CSV_PATH, index=False)
        print(f"[SAVE] Dataset saved to {CSV_PATH}")

    print(f"\n[INFO] Dataset shape: {df.shape}")
    print(f"   Bucket distribution:\n{df['bucket'].value_counts().to_string()}")

    # Feature engineering
    print("\n[FEAT] Engineering features...")
    X = engineer_features(df)
    y_class = df['bucket'].map(REVERSE_BUCKET_MAP)  # Classification target
    y_reg = df['actual_crowd']  # Regression target

    feature_names = list(X.columns)
    print(f"   Feature count: {len(feature_names)}")

    # Train/test split
    X_train, X_test, y_cls_train, y_cls_test, y_reg_train, y_reg_test = train_test_split(
        X, y_class, y_reg, test_size=0.2, random_state=42
    )

    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # --- Classification Model (Production) ---
    print("\n[TRAIN] Training RandomForestClassifier (production model)...")
    clf = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        random_state=42,
        n_jobs=-1,
    )
    clf.fit(X_train_scaled, y_cls_train)
    y_cls_pred = clf.predict(X_test_scaled)

    print("\n[REPORT] Classification Report:")
    print(classification_report(y_cls_test, y_cls_pred, target_names=['Low', 'Medium', 'High']))
    print("Confusion Matrix:")
    print(confusion_matrix(y_cls_test, y_cls_pred))

    # --- Regression Model (Comparison) ---
    print("\n[TRAIN] Training LinearRegression (comparison model)...")
    reg = LinearRegression()
    reg.fit(X_train_scaled, y_reg_train)
    y_reg_pred = reg.predict(X_test_scaled)
    r2 = r2_score(y_reg_test, y_reg_pred)
    print(f"   R² Score: {r2:.4f}")

    # Save artifacts
    SAVED_DIR.mkdir(parents=True, exist_ok=True)

    model_path = SAVED_DIR / 'model.pkl'
    scaler_path = SAVED_DIR / 'scaler.pkl'
    features_path = SAVED_DIR / 'feature_names.json'

    joblib.dump(clf, model_path)
    joblib.dump(scaler, scaler_path)
    with open(features_path, 'w') as f:
        json.dump(feature_names, f, indent=2)

    print(f"\n[SAVE] Saved artifacts to {SAVED_DIR}/")
    print(f"   [OK] model.pkl ({model_path.stat().st_size / 1024:.1f} KB)")
    print(f"   [OK] scaler.pkl ({scaler_path.stat().st_size / 1024:.1f} KB)")
    print(f"   [OK] feature_names.json ({len(feature_names)} features)")
    print("\n" + "=" * 60)
    print("[DONE] Training complete! You can now start the Django server.")
    print("=" * 60)


if __name__ == '__main__':
    train_model()
