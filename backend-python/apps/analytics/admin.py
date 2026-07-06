# apps/analytics/admin.py
from django.contrib import admin
from .models import DailyAnalyticsSummary

@admin.register(DailyAnalyticsSummary)
class DailyAnalyticsSummaryAdmin(admin.ModelAdmin):
    list_display = ('date', 'total_bookings', 'peak_station', 'avg_passengers')
