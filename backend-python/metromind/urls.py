# metromind/urls.py
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse


def root_health(request):
    return JsonResponse({
        'status': 'ok',
        'service': 'metromind-ml-api',
        'version': '1.0',
        'endpoints': ['/api/predict/', '/api/analytics/', '/api/health/'],
    })


urlpatterns = [
    path('', root_health),
    path('admin/', admin.site.urls),
    path('api/predict/', include('apps.predict.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
    path('api/health/', include('apps.health.urls')),
]
