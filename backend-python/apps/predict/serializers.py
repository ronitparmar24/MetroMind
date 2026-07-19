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
