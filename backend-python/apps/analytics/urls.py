# apps/analytics/urls.py
from django.urls import path
from .views import (
    HeatmapView, PeaksView, ChartsView, StationProfileView, NetworkPulseView,
    AdminModelPerformanceView, AdminPredictionVolumeView,
    AdminFeatureDriftView, AdminNetworkSummaryView
)

urlpatterns = [
    path('heatmap/', HeatmapView.as_view(), name='heatmap'),
    path('peaks/', PeaksView.as_view(), name='peaks'),
    path('charts/', ChartsView.as_view(), name='charts'),
    path('station-profile/<str:station_name>/', StationProfileView.as_view(), name='station-profile'),
    path('network-pulse/', NetworkPulseView.as_view(), name='network-pulse'),
    
    # Admin ML Endpoints
    path('admin/model-performance/', AdminModelPerformanceView.as_view(), name='admin-model-perf'),
    path('admin/prediction-volume/', AdminPredictionVolumeView.as_view(), name='admin-pred-volume'),
    path('admin/feature-drift/', AdminFeatureDriftView.as_view(), name='admin-feature-drift'),
    path('admin/network-summary/', AdminNetworkSummaryView.as_view(), name='admin-network-summary'),
]
