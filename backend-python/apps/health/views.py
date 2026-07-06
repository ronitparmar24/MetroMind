# apps/health/views.py
from rest_framework.views import APIView
from rest_framework.response import Response


class HealthView(APIView):
    """GET /api/health/ — Service health check"""
    
    def get(self, request):
        try:
            from apps.predict.ml.predict import is_model_loaded
            model_loaded = is_model_loaded()
        except Exception:
            model_loaded = False
        
        return Response({
            'status': 'ok',
            'service': 'metromind-intelligence-api',
            'model_loaded': model_loaded,
        })
