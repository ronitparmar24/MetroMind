import joblib
from pathlib import Path
import warnings

warnings.filterwarnings('ignore', message='.*deprecated.*', module='.*numba.*')

try:
    import shap
    SHAP_AVAILABLE = True
except ImportError as e:
    print(f"[WARN] shap library not available ({e}). Explainability disabled.")
    SHAP_AVAILABLE = False

BASE = Path(__file__).parent / 'saved'

_model = None
_explainer = None

def _get_explainer():
    """Lazy load explainer to avoid blocking module load if model isn't built yet"""
    global _model, _explainer
    if not SHAP_AVAILABLE:
        return None
    if _model is None:
        model_path = BASE / 'model.pkl'
        if not model_path.exists():
            return None
        _model = joblib.load(model_path)
    
    if _explainer is None:
        _explainer = shap.TreeExplainer(_model)
    return _explainer

def explain_prediction(feature_vector, feature_names):
    """
    Given a single observation's feature vector (as a 2D numpy array) and feature names,
    compute the SHAP values and return the top 3 features that impacted this specific prediction.
    """
    explainer = _get_explainer()
    if not explainer:
        return []

    # Get SHAP values for this observation
    shap_values = explainer.shap_values(feature_vector, check_additivity=False)
    
    # shap_values shape depends on n_classes for classifiers —
    # take the values for the predicted class
    predicted_class_idx = _model.predict(feature_vector)[0]
    class_idx = list(_model.classes_).index(predicted_class_idx)
    
    # Extract values for this specific sample (index 0) and specific class
    if isinstance(shap_values, list):
        values = shap_values[class_idx][0]
    elif len(shap_values.shape) == 3:
        # (n_samples, n_features, n_classes)
        values = shap_values[0, :, class_idx]
    else:
        values = shap_values[0]

    contributions = sorted(
        zip(feature_names, values), key=lambda x: abs(x[1]), reverse=True
    )[:3]
    
    return [
        {
            'feature': name,
            'impact': round(float(val), 4),
            'direction': 'increased' if val > 0 else 'decreased',
        }
        for name, val in contributions
    ]
