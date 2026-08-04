#!/usr/bin/env python
"""
apps/predict/ml/train_clusters.py
Run once (CLI) to train the Unsupervised KMeans clustering model on synthetic commuter profiles.
"""
import sys
import numpy as np
import pandas as pd
from pathlib import Path

# Add project root to path
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

# pyrefly: ignore [missing-import]
from apps.predict.ml.clustering import train_commuter_clusters, CLUSTER_LABELS

def generate_synthetic_profiles(n_users=200):
    """
    Simulates user behavior profiles to train the KMeans clustering model.
    Features: ['avg_hour', 'weekend_ratio', 'peak_ratio', 'avg_distance', 'trip_count']
    """
    np.random.seed(42)
    profiles = []
    
    for _ in range(n_users):
        # Determine archetype randomly to ensure diverse clusters
        archetype = np.random.choice([0, 1, 2, 3, 4])
        
        if archetype == 0:
            # Morning Regular
            avg_hour = np.random.normal(8, 1)
            weekend_ratio = np.random.uniform(0.0, 0.2)
            peak_ratio = np.random.uniform(0.7, 1.0)
            avg_distance = np.random.normal(8, 2)
            trip_count = int(np.random.normal(40, 5))
        elif archetype == 1:
            # Weekend Wanderer
            avg_hour = np.random.normal(14, 3)
            weekend_ratio = np.random.uniform(0.6, 1.0)
            peak_ratio = np.random.uniform(0.0, 0.4)
            avg_distance = np.random.normal(12, 4)
            trip_count = int(np.random.normal(15, 5))
        elif archetype == 2:
            # Peak Avoider (Smart Commuter)
            avg_hour = np.random.choice([np.random.normal(11, 1), np.random.normal(15, 1)])
            weekend_ratio = np.random.uniform(0.2, 0.5)
            peak_ratio = np.random.uniform(0.0, 0.3)
            avg_distance = np.random.normal(6, 2)
            trip_count = int(np.random.normal(25, 8))
        elif archetype == 3:
            # Long Distance
            avg_hour = np.random.normal(9, 2)
            weekend_ratio = np.random.uniform(0.1, 0.3)
            peak_ratio = np.random.uniform(0.5, 0.8)
            avg_distance = np.random.normal(25, 5) # high distance
            trip_count = int(np.random.normal(30, 10))
        else:
            # Occasional
            avg_hour = np.random.normal(12, 4)
            weekend_ratio = np.random.uniform(0.1, 0.8)
            peak_ratio = np.random.uniform(0.1, 0.5)
            avg_distance = np.random.normal(5, 3)
            trip_count = int(np.random.uniform(2, 10))
            
        profiles.append({
            'avg_hour': max(0, min(23, avg_hour)),
            'weekend_ratio': max(0.0, min(1.0, weekend_ratio)),
            'peak_ratio': max(0.0, min(1.0, peak_ratio)),
            'avg_distance': max(1.0, avg_distance),
            'trip_count': max(1, trip_count)
        })
        
    return pd.DataFrame(profiles)

def train():
    print("=" * 60)
    print("[METRO] MetroMind ML Pipeline - KMeans Clustering (Similar Commuters)")
    print("=" * 60)
    
    df = generate_synthetic_profiles(200)
    print(f"[DATA] Generated {len(df)} synthetic user profiles.")
    
    kmeans, scaler = train_commuter_clusters(df)
    
    print("\n[TRAIN] KMeans model trained with 5 clusters.")
    
    # Analyze centroids to map them roughly to labels
    centroids = scaler.inverse_transform(kmeans.cluster_centers_)
    features = ['avg_hour', 'weekend_ratio', 'peak_ratio', 'avg_distance', 'trip_count']
    
    print("\n[CENTROIDS] Cluster characteristics:")
    for i, centroid in enumerate(centroids):
        label = CLUSTER_LABELS.get(i, f"Cluster {i}")
        stats = ", ".join([f"{feat}={val:.2f}" for feat, val in zip(features, centroid)])
        print(f" - [{i}] {label}: {stats}")
        
    print("\n" + "=" * 60)
    print("[DONE] Clustering artifacts saved.")
    print("=" * 60)

if __name__ == '__main__':
    train()
