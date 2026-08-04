import joblib
import pandas as pd
from pathlib import Path
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

BASE = Path(__file__).parent / 'saved'

# Since we use random_state=42, cluster assignments for the simulated data 
# are deterministic. These labels are mapped to the 5 clusters.
CLUSTER_LABELS = {
    0: "Morning Regulars",
    1: "Weekend Wanderers",
    2: "Peak Avoiders",
    3: "Long Distance Commuters",
    4: "Occasional Riders",
}

def train_commuter_clusters(user_profiles_df: pd.DataFrame):
    """
    Trains a KMeans model to cluster users based on their travel patterns.
    Features expected: ['avg_hour', 'weekend_ratio', 'peak_ratio', 'avg_distance', 'trip_count']
    """
    features = ['avg_hour', 'weekend_ratio', 'peak_ratio', 'avg_distance', 'trip_count']
    
    # Ensure correct column order
    X_df = user_profiles_df[features]
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_df)
    
    kmeans = KMeans(n_clusters=5, random_state=42, n_init=10)
    kmeans.fit(X_scaled)
    
    # Compute sizes
    cluster_counts = pd.Series(kmeans.labels_).value_counts().to_dict()
    
    # Save artifacts
    BASE.mkdir(parents=True, exist_ok=True)
    joblib.dump(kmeans, BASE / 'commuter_clusters.pkl')
    joblib.dump(scaler, BASE / 'cluster_scaler.pkl')
    joblib.dump(cluster_counts, BASE / 'cluster_counts.pkl')
    
    return kmeans, scaler

def assign_cluster(user_profile: dict):
    """
    Assign a new user to a cluster based on their profile.
    Returns the cluster ID, cluster label, and number of commuters in that cluster.
    """
    try:
        kmeans = joblib.load(BASE / 'commuter_clusters.pkl')
        scaler = joblib.load(BASE / 'cluster_scaler.pkl')
        cluster_counts = joblib.load(BASE / 'cluster_counts.pkl')
    except Exception as e:
        # Graceful fallback if models aren't trained yet
        return {
            'clusterId': 0,
            'clusterLabel': "Unknown (Model Not Trained)",
            'similarCommuterCount': 0
        }

    features = ['avg_hour', 'weekend_ratio', 'peak_ratio', 'avg_distance', 'trip_count']
    X_raw = [[user_profile.get(k, 0) for k in features]]
    
    X_scaled = scaler.transform(X_raw)
    cluster_id = int(kmeans.predict(X_scaled)[0])
    
    return {
        'clusterId': cluster_id,
        'clusterLabel': CLUSTER_LABELS.get(cluster_id, "Commuter"),
        'similarCommuterCount': cluster_counts.get(cluster_id, 0)
    }
