# apps/analytics/urls.py
from django.urls import path
from .views import HeatmapView, PeaksView, ChartsView

urlpatterns = [
    path('heatmap/', HeatmapView.as_view(), name='heatmap'),
    path('peaks/', PeaksView.as_view(), name='peaks'),
    path('charts/', ChartsView.as_view(), name='charts'),
]
