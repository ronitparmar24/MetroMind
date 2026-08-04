# apps/predict/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import (
    PredictionInputSerializer,
    AnomalyInputSerializer,
    PersonalityInputSerializer,
    BestDepartureInputSerializer,
)
from .models import PredictionLog


class PredictView(APIView):
    """
    POST /api/predict/
    Takes {station, hour, day, passengers} → returns {bucket, confidence, top_features}
    
    This endpoint is INTERNAL — called only by the Node service (API Gateway pattern),
    never directly by the browser.
    """
    
    def post(self, request):
        serializer = PredictionInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        
        # Import here to avoid loading model at module import time during migrations
        from .ml.predict import run_prediction
        
        result = run_prediction(data)
        
        # Log prediction for audit/EDA
        try:
            PredictionLog.objects.create(
                station=data['station'],
                hour=data['hour'],
                day=data['day'],
                pred_bucket=result['bucket'],
                pred_score=result.get('score', 0),
                prediction_type='crowd',
            )
        except Exception as e:
            # Don't fail the prediction if logging fails
            print(f"⚠️ Failed to log prediction: {e}")
        
        return Response(result)


class AnomalyCheckView(APIView):
    """
    POST /api/predict/anomaly/
    Takes {station, hour, day, crowd} → returns {isAnomaly, anomalyScore, message}
    """

    def post(self, request):
        serializer = AnomalyInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        from .ml.predict import run_anomaly_check

        result = run_anomaly_check(
            station=data['station'],
            hour=data['hour'],
            day_of_week=data['day'],
            actual_or_predicted_crowd=data['crowd'],
        )

        # Log to PredictionLog
        try:
            PredictionLog.objects.create(
                station=data['station'],
                hour=data['hour'],
                day=data['day'],
                pred_bucket='anomaly' if result['isAnomaly'] else 'normal',
                pred_score=result['anomalyScore'],
                prediction_type='anomaly',
            )
        except Exception as e:
            print(f"⚠️ Failed to log anomaly check: {e}")

        return Response(result)


class PersonalityAnalysisView(APIView):
    """
    POST /api/predict/personality/
    Takes {ticket_history: [{hour, day, station, crowdBucket}, ...]}
    → returns {personality, description, ratios, totalTrips}
    """

    def post(self, request):
        serializer = PersonalityInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        from .ml.predict import run_personality_analysis

        result = run_personality_analysis(data['ticket_history'])

        # Log to PredictionLog — use first trip's station or 'N/A'
        try:
            first_trip = data['ticket_history'][0] if data['ticket_history'] else {}
            PredictionLog.objects.create(
                station=first_trip.get('station', 'N/A'),
                hour=first_trip.get('hour', 0),
                day=first_trip.get('day', 0),
                pred_bucket=result['personality'],
                pred_score=result['totalTrips'],
                prediction_type='personality',
            )
        except Exception as e:
            print(f"⚠️ Failed to log personality analysis: {e}")

        return Response(result)


class BestDepartureView(APIView):
    """
    POST /api/predict/best-departure/
    Takes {station, hour, day} → returns {bestHour, bestBucket, options, recommendation}
    """

    def post(self, request):
        serializer = BestDepartureInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        from .ml.predict import run_best_departure

        result = run_best_departure(
            station=data['station'],
            target_hour=data['hour'],
            day_of_week=data['day'],
        )

        # Log to PredictionLog
        try:
            PredictionLog.objects.create(
                station=data['station'],
                hour=data['hour'],
                day=data['day'],
                pred_bucket=result['bestBucket'],
                pred_score=result['bestConfidence'],
                prediction_type='best_departure',
            )
        except Exception as e:
            print(f"⚠️ Failed to log best departure: {e}")

        return Response(result)


class ClusterView(APIView):
    """
    POST /api/predict/cluster/
    Takes {user_profile: {avg_hour, weekend_ratio, peak_ratio, avg_distance, trip_count}}
    → returns {clusterId, clusterLabel, similarCommuterCount}
    """

    def post(self, request):
        from .serializers import ClusterInputSerializer
        serializer = ClusterInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        from .ml.clustering import assign_cluster
        result = assign_cluster(data['user_profile'])

        # Log to PredictionLog
        try:
            PredictionLog.objects.create(
                station='N/A',
                hour=0,
                day=0,
                pred_bucket=result['clusterLabel'],
                pred_score=result['clusterId'],
                prediction_type='cluster',
            )
        except Exception as e:
            print(f"⚠️ Failed to log cluster: {e}")

        return Response(result)


class ForecastView(APIView):
    """
    POST /api/predict/forecast/
    Takes {station, start_datetime, hours_ahead}
    → returns {forecast: [{time, hour, bucket, confidence, score, shap_explanation}, ...]}
    
    This is feature-based multi-step forecasting (running the point-in-time model iteratively),
    not a time-series model (e.g., ARIMA/Prophet) as the synthetic dataset lacks true autocorrelation.
    """

    def post(self, request):
        from .serializers import ForecastInputSerializer
        serializer = ForecastInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        from .ml.forecast import forecast_next_hours
        result = forecast_next_hours(
            station=data['station'],
            start_datetime=data['start_datetime'],
            hours_ahead=data['hours_ahead']
        )

        # Log to PredictionLog
        try:
            if result:
                first = result[0]
                PredictionLog.objects.create(
                    station=data['station'],
                    hour=first['hour'],
                    day=data['start_datetime'].weekday(),
                    pred_bucket=first['bucket'],
                    pred_score=first['confidence'],
                    prediction_type='forecast',
                )
        except Exception as e:
            print(f"⚠️ Failed to log forecast: {e}")

        return Response({'forecast': result})
