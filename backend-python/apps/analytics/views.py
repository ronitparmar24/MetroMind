# apps/analytics/views.py
"""
Analytics endpoints — serve heatmap, peaks, chart data, and station profiles.
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
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from functools import wraps
import os
import datetime
from django.utils import timezone
from django.db import models
from apps.predict.models import BookingSample, PredictionLog  # pyrefly: ignore [missing-import]

from apps.predict.ml.features import STATIONS, is_peak_hour  # pyrefly: ignore [missing-import]

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


class StationProfileView(APIView):
    """
    GET /api/analytics/station-profile/<station_name>/
    Returns a full statistical profile for a station computed from the crowd dataset.
    """

    def get(self, request, station_name):
        try:
            df = pd.read_csv(DATA_PATH)
        except FileNotFoundError:
            return Response({'error': 'Dataset not found'}, status=404)

        # URL-decode station name (spaces come through as %20 or +)
        station = station_name.replace('-', ' ')

        # Check the station exists in the data
        station_df = df[df['station'] == station]
        if station_df.empty:
            # Try case-insensitive match
            mask = df['station'].str.lower() == station.lower()
            station_df = df[mask]
            if station_df.empty:
                available = sorted(df['station'].unique().tolist())
                return Response({
                    'error': f'Station "{station}" not found in dataset',
                    'available_stations': available,
                }, status=404)
            # Use the canonical name from the data
            station = station_df['station'].iloc[0]

        total_data_points = len(station_df)

        # ── Hourly average crowd (all 17 operating hours: 6–22) ──
        hourly_avg = {}
        for hour in range(6, 23):
            hour_data = station_df[station_df['hour'] == hour]
            if len(hour_data) > 0:
                hourly_avg[str(hour)] = round(float(hour_data['actual_crowd'].mean()), 1)
            else:
                hourly_avg[str(hour)] = None  # No data for this hour

        # ── Busiest and quietest day of week ─────────────────────
        day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        daily_avg = station_df.groupby('day_of_week')['actual_crowd'].mean()

        if not daily_avg.empty:
            busiest_day_idx = int(daily_avg.idxmax())
            quietest_day_idx = int(daily_avg.idxmin())
            busiest_day = {
                'day': day_names[busiest_day_idx],
                'dayIndex': busiest_day_idx,
                'avgCrowd': round(float(daily_avg[busiest_day_idx]), 1),
            }
            quietest_day = {
                'day': day_names[quietest_day_idx],
                'dayIndex': quietest_day_idx,
                'avgCrowd': round(float(daily_avg[quietest_day_idx]), 1),
            }
        else:
            busiest_day = None
            quietest_day = None

        # ── Weekday vs weekend average delta ─────────────────────
        weekday_data = station_df[station_df['day_of_week'] < 5]
        weekend_data = station_df[station_df['day_of_week'] >= 5]

        weekday_avg = round(float(weekday_data['actual_crowd'].mean()), 1) if len(weekday_data) > 0 else 0.0
        weekend_avg = round(float(weekend_data['actual_crowd'].mean()), 1) if len(weekend_data) > 0 else 0.0
        delta_absolute = round(weekday_avg - weekend_avg, 1)
        delta_pct = round((delta_absolute / weekday_avg) * 100, 1) if weekday_avg > 0 else 0.0

        weekday_weekend = {
            'weekdayAvg': weekday_avg,
            'weekendAvg': weekend_avg,
            'deltaAbsolute': delta_absolute,
            'deltaPct': delta_pct,
            'busierOn': 'weekdays' if weekday_avg > weekend_avg else 'weekends',
        }

        # ── Station rank among all stations ──────────────────────
        all_station_avgs = (
            df.groupby('station')['actual_crowd']
            .mean()
            .sort_values(ascending=False)
        )
        total_stations = len(all_station_avgs)
        station_avg = round(float(all_station_avgs[station]), 1)

        # Compute rank (1-indexed)
        rank = int((all_station_avgs.values > station_avg).sum()) + 1

        # Ordinal suffix
        def ordinal(n):
            if 11 <= (n % 100) <= 13:
                suffix = 'th'
            else:
                suffix = {1: 'st', 2: 'nd', 3: 'rd'}.get(n % 10, 'th')
            return f"{n}{suffix}"

        rank_info = {
            'rank': rank,
            'totalStations': total_stations,
            'label': f"{ordinal(rank)} busiest of {total_stations} stations",
            'avgCrowd': station_avg,
        }

        return Response({
            'station': station,
            'totalDataPoints': total_data_points,
            'hourlyAvgCrowd': hourly_avg,
            'busiestDay': busiest_day,
            'quietestDay': quietest_day,
            'weekdayWeekend': weekday_weekend,
            'stationRank': rank_info,
        })


class NetworkPulseView(APIView):
    """
    GET /api/analytics/network-pulse/
    System-wide real-time pulse: run crowd predictions for the current hour/day
    across ALL stations, return per-station buckets, busiest/quietest, and
    derived average wait time.
    """

    def get(self, request):
        from datetime import datetime
        from apps.predict.ml.predict import run_prediction, is_model_loaded  # pyrefly: ignore [missing-import]

        now = datetime.now()
        hour = now.hour
        # Python day: Monday=0, Sunday=6
        js_day = now.weekday()

        stations_result = []

        if is_model_loaded():
            # Run ML prediction across all stations
            for station in STATIONS:
                try:
                    pred = run_prediction({
                        'station': station,
                        'hour': hour,
                        'day': js_day,
                        'passengers': 1,
                    })
                    bucket = pred.get('bucket', 'Medium')
                    confidence = pred.get('confidence', 50.0)
                    # Derive a crowd percentage from bucket + confidence
                    base_pct = {'Low': 25, 'Medium': 55, 'High': 85}.get(bucket, 55)
                    # Adjust slightly by confidence
                    pct = min(100, max(5, base_pct + int((confidence - 50) * 0.3)))
                    stations_result.append({
                        'name': station,
                        'bucket': bucket,
                        'pct': pct,
                    })
                except Exception:
                    stations_result.append({
                        'name': station,
                        'bucket': 'Medium',
                        'pct': 50,
                    })
        else:
            # Fallback: use historical averages from the dataset
            try:
                df = pd.read_csv(DATA_PATH)
                hour_data = df[df['hour'] == hour]
                for station in STATIONS:
                    st_data = hour_data[hour_data['station'] == station]
                    if len(st_data) > 0:
                        avg = float(st_data['actual_crowd'].mean())
                        if avg >= 70:
                            bucket = 'High'
                        elif avg >= 40:
                            bucket = 'Medium'
                        else:
                            bucket = 'Low'
                        pct = min(100, max(5, int(avg)))
                    else:
                        bucket = 'Medium'
                        pct = 50
                    stations_result.append({
                        'name': station,
                        'bucket': bucket,
                        'pct': pct,
                    })
            except FileNotFoundError:
                for station in STATIONS:
                    stations_result.append({
                        'name': station,
                        'bucket': 'Medium',
                        'pct': 50,
                    })

        # Derive busiest and quietest
        sorted_by_pct = sorted(stations_result, key=lambda s: s['pct'], reverse=True)
        busiest = sorted_by_pct[0] if sorted_by_pct else None
        quietest = sorted_by_pct[-1] if sorted_by_pct else None

        # Derive average wait minutes from average bucket
        # Low → ~2 min, Medium → ~4 min, High → ~7 min
        wait_map = {'Low': 2, 'Medium': 4, 'High': 7}
        total_wait = sum(wait_map.get(s['bucket'], 4) for s in stations_result)
        avg_wait = round(total_wait / len(stations_result), 1) if stations_result else 4.0

        # Estimated active riders (based on crowd distribution)
        high_count = sum(1 for s in stations_result if s['bucket'] == 'High')
        med_count = sum(1 for s in stations_result if s['bucket'] == 'Medium')
        low_count = sum(1 for s in stations_result if s['bucket'] == 'Low')
        # Rough estimate: each high station ~180 riders, medium ~90, low ~35
        estimated_riders = high_count * 180 + med_count * 90 + low_count * 35

        # ── Network Health Score (0-100) ─────────────────────────
        # 100 = no stations in High bucket
        # Penalty: percentage of High stations × 2.5 weight
        # Medium stations carry a light penalty (0.5 weight)
        total = len(stations_result) if stations_result else 1
        high_pct = (high_count / total) * 100
        med_pct = (med_count / total) * 100
        health_raw = 100 - (high_pct * 2.5) - (med_pct * 0.5)
        network_health_score = max(0, min(100, round(health_raw)))

        return Response({
            'stations': stations_result,
            'busiest': busiest,
            'quietest': quietest,
            'avgWaitMinutes': avg_wait,
            'estimatedRiders': estimated_riders,
            'networkHealthScore': network_health_score,
            'hour': hour,
            'day': js_day,
            'totalStations': len(stations_result),
            'modelLoaded': is_model_loaded(),
        })


def _fig_to_base64(fig):
    """Convert matplotlib figure to base64 PNG string."""
    buf = io.BytesIO()
    fig.savefig(buf, format='png', dpi=100, bbox_inches='tight')
    buf.seek(0)
    return base64.b64encode(buf.read()).decode('utf-8')

# ==========================================
# ADMIN ML ANALYTICS ENDPOINTS
# ==========================================

def admin_proxy_required(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        # HTTP_X_INTERNAL_SECRET is how Django sees the X-Internal-Secret header
        secret = request.META.get('HTTP_X_INTERNAL_SECRET')
        expected = os.environ.get('ADMIN_PROXY_SECRET')
        if not expected or secret != expected:
            return JsonResponse({'error': 'Unauthorized admin proxy request'}, status=403)
        return view_func(request, *args, **kwargs)
    return _wrapped_view

@method_decorator(admin_proxy_required, name='dispatch')
class AdminModelPerformanceView(APIView):
    def get(self, request):
        report_path = Path(__file__).resolve().parent.parent.parent / 'predict' / 'ml' / 'saved' / 'comparison_report.json'
        hyper_path = Path(__file__).resolve().parent.parent.parent / 'predict' / 'ml' / 'saved' / 'hyperparameter_search.json'
        
        try:
            with open(report_path, 'r') as f:
                report = json.load(f)
            
            hyperparameters = None
            try:
                with open(hyper_path, 'r') as f:
                    tuning = json.load(f)
                    hyperparameters = tuning.get('best_params')
            except FileNotFoundError:
                pass
                
            report['hyperparameters'] = hyperparameters
            return Response(report)
        except FileNotFoundError:
            return Response({'error': 'Model comparison report not found'}, status=404)

@method_decorator(admin_proxy_required, name='dispatch')
class AdminPredictionVolumeView(APIView):
    def get(self, request):
        thirty_days_ago = timezone.now() - datetime.timedelta(days=30)
        logs = PredictionLog.objects.filter(created_at__gte=thirty_days_ago)
        
        from django.db.models import Count
        from django.db.models.functions import TruncDate
        
        daily_counts = logs.annotate(date=TruncDate('created_at')) \
                           .values('date', 'prediction_type') \
                           .annotate(count=Count('id')) \
                           .order_by('date')
                           
        result = {}
        for entry in daily_counts:
            date_str = entry['date'].strftime('%Y-%m-%d')
            ptype = entry['prediction_type']
            if date_str not in result:
                result[date_str] = {}
            result[date_str][ptype] = entry['count']
            
        return Response({'volume_last_30_days': result})

@method_decorator(admin_proxy_required, name='dispatch')
class AdminFeatureDriftView(APIView):
    def get(self, request):
        seven_days_ago = timezone.now() - datetime.timedelta(days=7)
        recent_logs = PredictionLog.objects.filter(created_at__gte=seven_days_ago)
        
        orig_hour_avg = BookingSample.objects.aggregate(models.Avg('hour'))['hour__avg'] or 0
        recent_hour_avg = recent_logs.aggregate(models.Avg('hour'))['hour__avg'] or 0
        
        orig_stations = list(BookingSample.objects.values('station').annotate(count=models.Count('id')).order_by('-count')[:5])
        recent_stations = list(recent_logs.values('station').annotate(count=models.Count('id')).order_by('-count')[:5])
        
        return Response({
            'drift': {
                'average_hour': {
                    'training': round(orig_hour_avg, 2),
                    'live_last_7d': round(recent_hour_avg, 2),
                    'delta': round(recent_hour_avg - orig_hour_avg, 2)
                },
                'top_stations': {
                    'training': orig_stations,
                    'live_last_7d': recent_stations
                }
            }
        })

@method_decorator(admin_proxy_required, name='dispatch')
class AdminNetworkSummaryView(APIView):
    def get(self, request):
        bucket_dist = list(BookingSample.objects.values('bucket').annotate(count=models.Count('id')).order_by('-count'))
        high_stations = list(BookingSample.objects.filter(bucket='High').values('station').annotate(count=models.Count('id')).order_by('-count')[:5])
        
        recent_logs = PredictionLog.objects.all().order_by('-created_at')[:1000]
        if recent_logs:
            avg_confidence = sum(log.pred_score for log in recent_logs) / len(recent_logs)
        else:
            avg_confidence = 0
            
        return Response({
            'bucket_distribution': bucket_dist,
            'high_crowd_stations': high_stations,
            'recent_model_confidence_avg': round(avg_confidence, 2)
        })
