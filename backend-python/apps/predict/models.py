# apps/predict/models.py
from django.db import models


class BookingSample(models.Model):
    """Training dataset persisted in DB — each row is one booking observation."""
    station = models.CharField(max_length=100)
    hour = models.IntegerField()  # 0-23
    day_of_week = models.IntegerField()  # 0=Mon .. 6=Sun
    passengers = models.IntegerField()
    is_peak = models.BooleanField(default=False)
    is_weekend = models.BooleanField(default=False)
    actual_crowd = models.IntegerField()  # raw passenger count
    bucket = models.CharField(max_length=10, choices=[
        ('Low', 'Low'),
        ('Medium', 'Medium'),
        ('High', 'High'),
    ])
    recorded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.station} H{self.hour} D{self.day_of_week} → {self.bucket}"

    class Meta:
        ordering = ['-recorded_at']


class PredictionLog(models.Model):
    """Every inference served, for audit/EDA tracking."""
    station = models.CharField(max_length=100)
    hour = models.IntegerField()
    day = models.IntegerField()
    pred_bucket = models.CharField(max_length=10)
    pred_score = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.station} → {self.pred_bucket} ({self.pred_score:.2f})"

    class Meta:
        ordering = ['-created_at']
