# apps/predict/serializers.py
# pyrefly: ignore [missing-import]
from rest_framework import serializers


class PredictionInputSerializer(serializers.Serializer):
    station = serializers.CharField(max_length=100)
    hour = serializers.IntegerField(min_value=0, max_value=23)
    day = serializers.IntegerField(min_value=0, max_value=6)
    passengers = serializers.IntegerField(min_value=1, default=1)


class PredictionOutputSerializer(serializers.Serializer):
    bucket = serializers.CharField()
    confidence = serializers.FloatField()
    score = serializers.FloatField()
    top_features = serializers.ListField()


class AnomalyInputSerializer(serializers.Serializer):
    station = serializers.CharField(max_length=100)
    hour = serializers.IntegerField(min_value=0, max_value=23)
    day = serializers.IntegerField(min_value=0, max_value=6)
    crowd = serializers.IntegerField(min_value=0)


class TicketSerializer(serializers.Serializer):
    """Single trip entry within a ticket history."""
    hour = serializers.IntegerField(min_value=0, max_value=23)
    day = serializers.IntegerField(min_value=0, max_value=6)
    station = serializers.CharField(max_length=100)
    crowdBucket = serializers.CharField(max_length=10)


class PersonalityInputSerializer(serializers.Serializer):
    ticket_history = TicketSerializer(many=True)


class BestDepartureInputSerializer(serializers.Serializer):
    station = serializers.CharField(max_length=100)
    hour = serializers.IntegerField(min_value=0, max_value=23)
    day = serializers.IntegerField(min_value=0, max_value=6)


class ClusterProfileSerializer(serializers.Serializer):
    avg_hour = serializers.FloatField(min_value=0, max_value=24, default=12.0)
    weekend_ratio = serializers.FloatField(min_value=0, max_value=1.0, default=0.0)
    peak_ratio = serializers.FloatField(min_value=0, max_value=1.0, default=0.0)
    avg_distance = serializers.FloatField(min_value=0, default=5.0)
    trip_count = serializers.IntegerField(min_value=0, default=1)


class ClusterInputSerializer(serializers.Serializer):
    user_profile = ClusterProfileSerializer()


class ForecastInputSerializer(serializers.Serializer):
    station = serializers.CharField(max_length=100)
    start_datetime = serializers.DateTimeField()
    hours_ahead = serializers.IntegerField(min_value=1, max_value=24, default=17)
