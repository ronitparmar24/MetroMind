# apps/analytics/views.py
"""
Analytics endpoints — serve heatmap, peaks, and chart data.
These are internal endpoints called by Node, never by the browser directly.
"""
import json
import base64
import io
from pathlib import Path

import pandas as pd
import numpy as np
from rest_framework.views import APIView
from rest_framework.response import Response

from apps.predict.ml.features import STATIONS, is_peak_hour

DATA_PATH = Path(__file__).resolve().parent.parent.parent / 'data' / 'raw' / 'ahmedabad_metro_bookings.csv'


class HeatmapView(APIView):
    """GET /api/analytics/heatmap/ — Crowd-level matrix for all stations x 18 hours"""
    
    def get(self, request):
        try:
            df = pd.read_csv(DATA_PATH)
        except FileNotFoundError:
            return Response({'error': 'Dataset not found'}, status=404)
        
        # Build station x hour crowd matrix
        heatmap = {}
        for station in df['station'].unique():
            station_data = df[df['station'] == station]
            hourly = {}
            for hour in range(6, 23):
                hour_data = station_data[station_data['hour'] == hour]
                if len(hour_data) > 0:
                    hourly[str(hour)] = round(hour_data['actual_crowd'].mean(), 1)
                else:
                    hourly[str(hour)] = 0
            heatmap[station] = hourly
        
        return Response({
            'heatmap': heatmap,
            'hours': list(range(6, 23)),
            'stations': list(df['station'].unique()),
        })


class PeaksView(APIView):
    """GET /api/analytics/peaks/ — Top 5 busiest stations + hours from training data"""
    
    def get(self, request):
        try:
            df = pd.read_csv(DATA_PATH)
        except FileNotFoundError:
            return Response({'error': 'Dataset not found'}, status=404)
        
        # Top 5 busiest stations
        top_stations = (
            df.groupby('station')['actual_crowd']
            .mean()
            .sort_values(ascending=False)
            .head(5)
        )
        
        # Top 5 busiest hours
        top_hours = (
            df.groupby('hour')['actual_crowd']
            .mean()
            .sort_values(ascending=False)
            .head(5)
        )
        
        return Response({
            'top_stations': [
                {'station': s, 'avg_crowd': round(v, 1)}
                for s, v in top_stations.items()
            ],
            'top_hours': [
                {'hour': int(h), 'avg_crowd': round(v, 1)}
                for h, v in top_hours.items()
            ],
        })


class ChartsView(APIView):
    """GET /api/analytics/charts/ — Base64-encoded charts for EDA dashboard"""
    
    def get(self, request):
        try:
            df = pd.read_csv(DATA_PATH)
        except FileNotFoundError:
            return Response({'error': 'Dataset not found'}, status=404)
        
        charts = {}
        
        try:
            import matplotlib
            matplotlib.use('Agg')
            import matplotlib.pyplot as plt
            import seaborn as sns
            
            # 1. Crowd distribution by hour
            fig, ax = plt.subplots(figsize=(10, 4))
            hourly_avg = df.groupby('hour')['actual_crowd'].mean()
            ax.bar(hourly_avg.index, hourly_avg.values, color='#6366f1')
            ax.set_xlabel('Hour of Day')
            ax.set_ylabel('Average Crowd')
            ax.set_title('Average Crowd by Hour')
            plt.tight_layout()
            charts['hourly_crowd'] = _fig_to_base64(fig)
            plt.close(fig)
            
            # 2. Bucket distribution pie chart
            fig, ax = plt.subplots(figsize=(6, 6))
            bucket_counts = df['bucket'].value_counts()
            colors = ['#22c55e', '#eab308', '#ef4444']
            ax.pie(bucket_counts.values, labels=bucket_counts.index, 
                   colors=colors, autopct='%1.1f%%', startangle=90)
            ax.set_title('Crowd Bucket Distribution')
            plt.tight_layout()
            charts['bucket_distribution'] = _fig_to_base64(fig)
            plt.close(fig)
            
            # 3. Day of week pattern
            fig, ax = plt.subplots(figsize=(8, 4))
            days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            daily_avg = df.groupby('day_of_week')['actual_crowd'].mean()
            ax.plot(daily_avg.index, daily_avg.values, marker='o', color='#8b5cf6', linewidth=2)
            ax.set_xticks(range(7))
            ax.set_xticklabels(days)
            ax.set_ylabel('Average Crowd')
            ax.set_title('Crowd Pattern by Day of Week')
            plt.tight_layout()
            charts['daily_pattern'] = _fig_to_base64(fig)
            plt.close(fig)
            
        except ImportError:
            charts['error'] = 'Matplotlib/Seaborn not available'
        
        return Response({'charts': charts})


def _fig_to_base64(fig):
    """Convert matplotlib figure to base64 PNG string."""
    buf = io.BytesIO()
    fig.savefig(buf, format='png', dpi=100, bbox_inches='tight')
    buf.seek(0)
    return base64.b64encode(buf.read()).decode('utf-8')
