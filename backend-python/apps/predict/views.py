# apps/predict/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import PredictionInputSerializer
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
            )
        except Exception as e:
            # Don't fail the prediction if logging fails
            print(f"⚠️ Failed to log prediction: {e}")
        
        return Response(result)
