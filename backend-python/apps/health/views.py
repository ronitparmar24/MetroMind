# apps/health/views.py
from rest_framework.views import APIView
from rest_framework.response import Response


class HealthView(APIView):
    """GET /api/health/ — Service health check with per-model status"""
    
    def get(self, request):
        model_status = {
            'crowd_model': False,
            'anomaly_model': False,
            'regression_model': False,
            'gb_model': False,
        }

        try:
            from apps.predict.ml.predict import get_model_status
            model_status = get_model_status()
        except Exception:
            pass

        return Response({
            'status': 'ok',
            'service': 'metromind-intelligence-api',
            **model_status,
        })
