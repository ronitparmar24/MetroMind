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
            from ..predict.ml.predict import get_model_status  # pyrefly: ignore [missing-import]
            model_status = get_model_status()  # pyrefly: ignore [undefined-variable]
        except Exception:
            pass

        hyperparameters = None
        try:
            import json
            from ..predict.ml.predict import SAVED_DIR  # pyrefly: ignore [missing-import]
            with open(SAVED_DIR / 'hyperparameter_search.json', 'r') as f:
                tuning = json.load(f)
                hyperparameters = tuning.get('best_params')
        except Exception:
            pass

        return Response({
            'status': 'ok',
            'service': 'metromind-intelligence-api',
            'hyperparameters': hyperparameters,
            **model_status,
        })
