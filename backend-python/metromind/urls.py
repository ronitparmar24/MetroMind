# metromind/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/predict/', include('apps.predict.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
    path('api/health/', include('apps.health.urls')),
]
