# apps/predict/apps.py
from django.apps import AppConfig

class PredictConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.predict'
    verbose_name = 'Crowd Prediction ML Service'
