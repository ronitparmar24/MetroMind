# apps/predict/urls.py
from django.urls import path
from .views import (
    PredictView,
    AnomalyCheckView,
    PersonalityAnalysisView,
    BestDepartureView,
    ClusterView,
    ForecastView,
)

urlpatterns = [
    path('', PredictView.as_view(), name='predict'),
    path('anomaly/', AnomalyCheckView.as_view(), name='anomaly-check'),
    path('personality/', PersonalityAnalysisView.as_view(), name='personality-analysis'),
    path('best-departure/', BestDepartureView.as_view(), name='best-departure'),
    path('cluster/', ClusterView.as_view(), name='cluster'),
    path('forecast/', ForecastView.as_view(), name='forecast'),
]
