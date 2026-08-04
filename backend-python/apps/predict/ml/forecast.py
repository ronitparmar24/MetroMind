from .predict import run_prediction
from datetime import datetime, timedelta

def forecast_next_hours(station: str, start_datetime: datetime, hours_ahead: int = 17):
    """
    Feature-based multi-step forecasting: runs the same point-in-time classifier 
    repeatedly across future time-feature combinations to produce a curve.
    """
    forecast = []
    for h in range(hours_ahead):
        target_time = start_datetime + timedelta(hours=h)
        
        # Determine peak / weekend from datetime for features
        hour = target_time.hour
        is_peak = 1 if (8 <= hour <= 10 or 17 <= hour <= 20) else 0
        is_weekend = 1 if target_time.weekday() >= 5 else 0

        # Note: passengers = 1 as a neutral default baseline
        result = run_prediction({
            'station': station,
            'hour': hour,
            'day': target_time.weekday(),
            'passengers': 1,
            'is_peak': is_peak,
            'is_weekend': is_weekend,
        })
        
        forecast.append({
            'time': target_time.strftime('%H:%M'),
            'hour': hour,
            'bucket': result['bucket'],
            'confidence': result['confidence'],
            'score': result['score'],
            'shap_explanation': result.get('shap_explanation'),
        })
        
    return forecast
