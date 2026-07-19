# apps/analytics/urls.py
from django.urls import path
from .views import HeatmapView, PeaksView, ChartsView, StationProfileView, NetworkPulseView

urlpatterns = [
    path('heatmap/', HeatmapView.as_view(), name='heatmap'),
    path('peaks/', PeaksView.as_view(), name='peaks'),
    path('charts/', ChartsView.as_view(), name='charts'),
    path('station-profile/<str:station_name>/', StationProfileView.as_view(), name='station-profile'),
    path('network-pulse/', NetworkPulseView.as_view(), name='network-pulse'),
]
