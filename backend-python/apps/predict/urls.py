# apps/predict/urls.py
from django.urls import path
from .views import (
    PredictView,
    AnomalyCheckView,
    PersonalityAnalysisView,
    BestDepartureView,
)

urlpatterns = [
    path('', PredictView.as_view(), name='predict'),
    path('anomaly/', AnomalyCheckView.as_view(), name='anomaly-check'),
    path('personality/', PersonalityAnalysisView.as_view(), name='personality-analysis'),
    path('best-departure/', BestDepartureView.as_view(), name='best-departure'),
]
