# apps/analytics/models.py
from django.db import models


class DailyAnalyticsSummary(models.Model):
    """Aggregated daily analytics for dashboard display."""
    date = models.DateField(unique=True)
    total_bookings = models.IntegerField(default=0)
    peak_station = models.CharField(max_length=100, default='')
    avg_passengers = models.FloatField(default=0)
    total_co2_saved = models.FloatField(default=0)
    generated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Analytics {self.date}: {self.total_bookings} bookings"

    class Meta:
        ordering = ['-date']
        verbose_name_plural = 'Daily analytics summaries'
