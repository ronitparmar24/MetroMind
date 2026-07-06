# apps/predict/admin.py
from django.contrib import admin
from .models import BookingSample, PredictionLog

@admin.register(BookingSample)
class BookingSampleAdmin(admin.ModelAdmin):
    list_display = ('station', 'hour', 'day_of_week', 'bucket', 'actual_crowd', 'recorded_at')
    list_filter = ('bucket', 'station')

@admin.register(PredictionLog)
class PredictionLogAdmin(admin.ModelAdmin):
    list_display = ('station', 'hour', 'day', 'pred_bucket', 'pred_score', 'created_at')
    list_filter = ('pred_bucket',)
