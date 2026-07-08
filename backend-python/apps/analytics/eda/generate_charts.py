# apps/analytics/eda/generate_charts.py
"""
Standalone chart generation script for EDA dashboard.
Generates Seaborn/Matplotlib charts and saves them as PNG files.

Usage:
    python apps/analytics/eda/generate_charts.py
"""
import sys
from pathlib import Path

# Add project root to path
ROOT = Path(__file__).resolve().parent.parent.parent.parent
sys.path.insert(0, str(ROOT))

import pandas as pd
import numpy as np

DATA_PATH = ROOT / 'data' / 'raw' / 'ahmedabad_metro_bookings.csv'
OUTPUT_DIR = Path(__file__).resolve().parent / 'charts'


def generate_all_charts():
    """Generate all EDA charts and save to charts/ directory."""
    print("[CHARTS] MetroMind EDA Chart Generator")
    print("=" * 50)

    try:
        import matplotlib
        matplotlib.use('Agg')
        import matplotlib.pyplot as plt
        import seaborn as sns
        sns.set_theme(style='whitegrid')
    except ImportError:
        print("[ERROR] matplotlib/seaborn not installed. Run: pip install matplotlib seaborn")
        return

    if not DATA_PATH.exists():
        print(f"[ERROR] Dataset not found at {DATA_PATH}")
        print("  Run train.py first to generate the dataset.")
        return

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    df = pd.read_csv(DATA_PATH)
    print(f"[DATA] Loaded {len(df)} rows")

    # 1. Hourly crowd distribution
    fig, ax = plt.subplots(figsize=(12, 5))
    hourly_avg = df.groupby('hour')['actual_crowd'].mean()
    colors = ['#ef4444' if (8 <= h <= 10) or (17 <= h <= 20) else '#6366f1' for h in hourly_avg.index]
    ax.bar(hourly_avg.index, hourly_avg.values, color=colors)
    ax.set_xlabel('Hour of Day')
    ax.set_ylabel('Average Crowd')
    ax.set_title('Average Crowd by Hour (red = peak hours)')
    plt.tight_layout()
    fig.savefig(OUTPUT_DIR / 'hourly_crowd.png', dpi=150, bbox_inches='tight')
    plt.close(fig)
    print("[OK] hourly_crowd.png")

    # 2. Bucket distribution
    fig, ax = plt.subplots(figsize=(7, 7))
    if 'bucket' not in df.columns:
        df['bucket'] = df['actual_crowd'].apply(lambda v: 'Low' if v <= 50 else ('Medium' if v <= 150 else 'High'))
    bucket_counts = df['bucket'].value_counts()
    chart_colors = {'Low': '#22c55e', 'Medium': '#eab308', 'High': '#ef4444'}
    ax.pie(
        bucket_counts.values,
        labels=bucket_counts.index,
        colors=[chart_colors.get(b, '#999') for b in bucket_counts.index],
        autopct='%1.1f%%',
        startangle=90,
        textprops={'fontsize': 12}
    )
    ax.set_title('Crowd Bucket Distribution')
    plt.tight_layout()
    fig.savefig(OUTPUT_DIR / 'bucket_distribution.png', dpi=150, bbox_inches='tight')
    plt.close(fig)
    print("[OK] bucket_distribution.png")

    # 3. Day of week pattern
    fig, ax = plt.subplots(figsize=(10, 5))
    days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    daily_avg = df.groupby('day_of_week')['actual_crowd'].mean()
    bar_colors = ['#6366f1' if d < 5 else '#f59e0b' for d in range(7)]
    ax.bar(range(7), daily_avg.values, color=bar_colors)
    ax.set_xticks(range(7))
    ax.set_xticklabels(days)
    ax.set_ylabel('Average Crowd')
    ax.set_title('Crowd by Day of Week')
    plt.tight_layout()
    fig.savefig(OUTPUT_DIR / 'daily_pattern.png', dpi=150, bbox_inches='tight')
    plt.close(fig)
    print("[OK] daily_pattern.png")

    # 4. Station x Hour heatmap
    fig, ax = plt.subplots(figsize=(16, 8))
    pivot = df.pivot_table(values='actual_crowd', index='station', columns='hour', aggfunc='mean')
    sns.heatmap(pivot, cmap='YlOrRd', annot=True, fmt='.0f', linewidths=0.5, ax=ax)
    ax.set_title('Crowd Heatmap: Station x Hour')
    plt.tight_layout()
    fig.savefig(OUTPUT_DIR / 'crowd_heatmap.png', dpi=150, bbox_inches='tight')
    plt.close(fig)
    print("[OK] crowd_heatmap.png")

    # 5. Correlation matrix
    fig, ax = plt.subplots(figsize=(10, 8))
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    sns.heatmap(df[numeric_cols].corr(), annot=True, cmap='coolwarm', center=0, fmt='.2f', ax=ax)
    ax.set_title('Feature Correlation Matrix')
    plt.tight_layout()
    fig.savefig(OUTPUT_DIR / 'correlation_matrix.png', dpi=150, bbox_inches='tight')
    plt.close(fig)
    print("[OK] correlation_matrix.png")

    print("=" * 50)
    print(f"[DONE] 5 charts saved to {OUTPUT_DIR}/")


if __name__ == '__main__':
    generate_all_charts()
