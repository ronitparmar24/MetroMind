#!/usr/bin/env python
"""
apps/predict/ml/train.py
Run once (CLI) before first server start to train and save ML model artifacts.

Usage:
    python apps/predict/ml/train.py

This script:
1. Loads/generates the training dataset
2. Engineers features
3. Trains FOUR models:
   - RandomForestClassifier  (primary crowd bucket classifier)
   - GradientBoostingClassifier (comparison classifier — accuracy/F1 logged)
   - LinearRegression (continuous crowd count prediction)
   - IsolationForest (unsupervised anomaly detection)
4. Saves all artifacts to saved/
"""
import os
import sys
import json
import random
import datetime
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.ensemble import (
    RandomForestClassifier, 
    GradientBoostingClassifier,
    IsolationForest,
)
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    r2_score,
    accuracy_score,
    f1_score,
)
import joblib

# Add project root to path so we can import features
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from apps.predict.ml.features import (  # pyrefly: ignore [missing-import]
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

        # Simulate a recorded_at timestamp over the past year
        days_ago = random.randint(0, 365)
        recorded_at = datetime.datetime.now() - datetime.timedelta(days=days_ago)

        rows.append({
            'recorded_at': recorded_at.isoformat(),
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
    print("[METRO] MetroMind ML Pipeline - Training (4-Model Suite)")
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

    # ── Feature engineering ──────────────────────────────────────
    print("\n[FEAT] Engineering features...")
    
    # Time-aware split: sort by recorded_at to prevent future data leakage
    # Crowd patterns evolve over time, so random splitting can overstate real-world accuracy
    if 'recorded_at' in df.columns:
        df = df.sort_values('recorded_at').reset_index(drop=True)
        print("   [INFO] Dataset sorted chronologically by recorded_at for time-aware split.")
    
    X = engineer_features(df)
    y_class = df['bucket'].map(REVERSE_BUCKET_MAP)  # Classification target
    y_reg = df['actual_crowd']  # Regression target

    feature_names = list(X.columns)
    print(f"   Feature count: {len(feature_names)}")

    # Time-aware split: use the most recent 20% as test set instead of random split
    split_idx = int(len(df) * 0.8)
    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    y_cls_train, y_cls_test = y_class.iloc[:split_idx], y_class.iloc[split_idx:]
    y_reg_train, y_reg_test = y_reg.iloc[:split_idx], y_reg.iloc[split_idx:]

    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # ── 1. RandomForestClassifier (Primary) ──────────────────────
    print("\n[TRAIN] 1/4 — RandomForestClassifier (GridSearchCV hyperparameter tuning)...")
    from sklearn.model_selection import GridSearchCV
    
    param_grid = {
        'n_estimators': [50, 100, 150],
        'max_depth': [8, 12, None],
        'min_samples_split': [2, 5, 10],
    }
    
    grid = GridSearchCV(
        RandomForestClassifier(random_state=42),
        param_grid,
        cv=3,
        scoring='f1_weighted',
        n_jobs=-1
    )
    grid.fit(X_train_scaled, y_cls_train)
    rf_clf = grid.best_estimator_
    
    print('   Best params:', grid.best_params_)
    print('   Best CV F1:', grid.best_score_)
    
    rf_pred = rf_clf.predict(X_test_scaled)

    rf_accuracy = accuracy_score(y_cls_test, rf_pred)
    rf_f1 = f1_score(y_cls_test, rf_pred, average='weighted')

    print(f"   Accuracy: {rf_accuracy:.4f}  |  Weighted F1: {rf_f1:.4f}")
    print("\n[REPORT] RF Classification Report:")
    print(classification_report(y_cls_test, rf_pred, target_names=['Low', 'Medium', 'High']))
    print("Confusion Matrix:")
    print(confusion_matrix(y_cls_test, rf_pred))

    # ── 2. GradientBoostingClassifier (Comparison) ───────────────
    print("\n[TRAIN] 2/4 — GradientBoostingClassifier (comparison model)...")
    gb_clf = GradientBoostingClassifier(
        n_estimators=100,
        max_depth=5,
        learning_rate=0.1,
        random_state=42,
    )
    gb_clf.fit(X_train_scaled, y_cls_train)
    gb_pred = gb_clf.predict(X_test_scaled)

    gb_accuracy = accuracy_score(y_cls_test, gb_pred)
    gb_f1 = f1_score(y_cls_test, gb_pred, average='weighted')

    print(f"   Accuracy: {gb_accuracy:.4f}  |  Weighted F1: {gb_f1:.4f}")
    print("\n[REPORT] GB Classification Report:")
    print(classification_report(y_cls_test, gb_pred, target_names=['Low', 'Medium', 'High']))
    print("Confusion Matrix:")
    print(confusion_matrix(y_cls_test, gb_pred))

    # Build comparison report
    rf_report = classification_report(y_cls_test, rf_pred, target_names=['Low', 'Medium', 'High'], output_dict=True)
    gb_report = classification_report(y_cls_test, gb_pred, target_names=['Low', 'Medium', 'High'], output_dict=True)

    comparison_report = {
        'random_forest': {
            'accuracy': round(rf_accuracy, 4),
            'weighted_f1': round(rf_f1, 4),
            'per_class': {
                cls: {
                    'precision': round(rf_report[cls]['precision'], 4),
                    'recall': round(rf_report[cls]['recall'], 4),
                    'f1': round(rf_report[cls]['f1-score'], 4),
                }
                for cls in ['Low', 'Medium', 'High']
            },
        },
        'gradient_boosting': {
            'accuracy': round(gb_accuracy, 4),
            'weighted_f1': round(gb_f1, 4),
            'per_class': {
                cls: {
                    'precision': round(gb_report[cls]['precision'], 4),
                    'recall': round(gb_report[cls]['recall'], 4),
                    'f1': round(gb_report[cls]['f1-score'], 4),
                }
                for cls in ['Low', 'Medium', 'High']
            },
        },
        'winner': 'random_forest' if rf_f1 >= gb_f1 else 'gradient_boosting',
    }

    print("\n" + "-" * 40)
    print(f"[CMP] RF vs GB -> F1: {rf_f1:.4f} vs {gb_f1:.4f}")
    print(f"       Winner: {comparison_report['winner']}")
    print("-" * 40)

    # ── 3. LinearRegression (Continuous Crowd Count) ─────────────
    print("\n[TRAIN] 3/4 — LinearRegression (continuous crowd count)...")
    reg = LinearRegression()
    reg.fit(X_train_scaled, y_reg_train)
    y_reg_pred = reg.predict(X_test_scaled)
    r2 = r2_score(y_reg_test, y_reg_pred)
    print(f"   R² Score: {r2:.4f}")

    # ── 4. IsolationForest (Anomaly Detection) ───────────────────
    print("\n[TRAIN] 4/4 — IsolationForest (anomaly detection)...")
    # Train on interpretable raw features: hour, day_of_week, station_encoded, actual_crowd
    station_encoder = LabelEncoder()
    station_encoded = station_encoder.fit_transform(df['station'])

    anomaly_features = np.column_stack([
        df['hour'].values,
        df['day_of_week'].values,
        station_encoded,
        df['actual_crowd'].values,
    ])

    iso_forest = IsolationForest(
        n_estimators=100,
        contamination=0.05,
        random_state=42,
        n_jobs=-1,
    )
    iso_forest.fit(anomaly_features)

    # Report anomaly stats
    anomaly_labels = iso_forest.predict(anomaly_features)
    n_anomalies = (anomaly_labels == -1).sum()
    anomaly_scores = iso_forest.decision_function(anomaly_features)
    print(f"   Detected {n_anomalies}/{len(df)} anomalies in training data ({n_anomalies/len(df)*100:.1f}%)")
    print(f"   Score range: [{anomaly_scores.min():.4f}, {anomaly_scores.max():.4f}]")

    # ── Save all artifacts ───────────────────────────────────────
    SAVED_DIR.mkdir(parents=True, exist_ok=True)

    artifacts = {
        'model.pkl': rf_clf,
        'gb_model.pkl': gb_clf,
        'regression_model.pkl': reg,
        'anomaly_model.pkl': iso_forest,
        'scaler.pkl': scaler,
        'station_encoder.pkl': station_encoder,
    }

    for filename, obj in artifacts.items():
        path = SAVED_DIR / filename
        joblib.dump(obj, path)

    # Save feature names
    features_path = SAVED_DIR / 'feature_names.json'
    with open(features_path, 'w') as f:
        json.dump(feature_names, f, indent=2)

    # Save comparison report
    report_path = SAVED_DIR / 'comparison_report.json'
    with open(report_path, 'w') as f:
        json.dump(comparison_report, f, indent=2)

    # Save hyperparameter tuning results
    tuning_results = {
        'best_params': grid.best_params_,
        'best_score': round(float(grid.best_score_), 4),
        'cv_results': {
            'mean_test_score': [round(float(s), 4) for s in grid.cv_results_['mean_test_score']],
            'params': grid.cv_results_['params'],
        }
    }
    with open(SAVED_DIR / 'hyperparameter_search.json', 'w') as f:
        json.dump(tuning_results, f, indent=2)

    print(f"\n[SAVE] Saved artifacts to {SAVED_DIR}/")
    for filename in list(artifacts.keys()) + ['feature_names.json', 'comparison_report.json', 'hyperparameter_search.json']:
        path = SAVED_DIR / filename
        size_kb = path.stat().st_size / 1024
        print(f"   [OK] {filename} ({size_kb:.1f} KB)")

    print("\n" + "=" * 60)
    print("[DONE] Training complete — 4 models saved!")
    print("       You can now start the Django server.")
    print("=" * 60)


if __name__ == '__main__':
    train_model()
