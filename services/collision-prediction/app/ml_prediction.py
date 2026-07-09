import os
import pickle
import math
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model.pkl')

ORBIT_TYPE_MAP = {'LEO': 0, 'MEO': 1, 'GEO': 2, 'HEO': 3}
OBJECT_TYPE_MAP = {'Satellite': 0, 'Debris': 1, 'RocketBody': 2, 'Unknown': 3}
RISK_LEVEL_MAP = {0: 'Low', 1: 'Medium', 2: 'High', 3: 'Critical'}
FEATURE_NAMES = [
    'altitudeDifference',
    'relativeVelocity',
    'inclinationDifference',
    'eccentricityDifference',
    'orbitType',
    'objectType'
]

def train_and_save_model():
    """
    Generates synthetic orbital data, trains a Random Forest classifier
    to predict collision risk level, and saves it.
    """
    np.random.seed(42)
    n_samples = 1500
    
    # 1. Generate features
    altitude_diffs = np.random.uniform(0.1, 1000.0, n_samples)
    relative_vels = np.random.uniform(0.0, 15.0, n_samples)
    inc_diffs = np.random.uniform(0.0, 90.0, n_samples)
    ecc_diffs = np.random.uniform(0.0, 0.5, n_samples)
    orbit_types = np.random.choice([0, 1, 2, 3], n_samples)
    object_types = np.random.choice([0, 1, 2, 3], n_samples)
    
    # 2. Determine risk labels based on physical thresholds
    labels = []
    for idx in range(n_samples):
        alt_d = altitude_diffs[idx]
        rel_v = relative_vels[idx]
        
        # Physics-based scoring
        score = 0
        if alt_d < 15:
            score += 4
        elif alt_d < 75:
            score += 2
        elif alt_d < 250:
            score += 1
            
        if rel_v > 9.0:
            score += 2
        elif rel_v > 4.5:
            score += 1
            
        if score >= 5:
            risk = 3  # Critical
        elif score >= 3:
            risk = 2  # High
        elif score >= 1:
            risk = 1  # Medium
        else:
            risk = 0  # Low
            
        labels.append(risk)
        
    labels = np.array(labels)
    
    # 3. Create DataFrame
    X = pd.DataFrame({
        'altitudeDifference': altitude_diffs,
        'relativeVelocity': relative_vels,
        'inclinationDifference': inc_diffs,
        'eccentricityDifference': ecc_diffs,
        'orbitType': orbit_types,
        'objectType': object_types
    })
    
    # 4. Train Random Forest
    model = RandomForestClassifier(n_estimators=50, random_state=42, max_depth=8)
    model.fit(X, labels)
    
    # 5. Save model
    with open(MODEL_PATH, 'wb') as f:
        pickle.dump(model, f)
        
    print("AI Collision Prediction model trained and saved successfully.")
    return model

def get_model():
    """
    Loads and returns the trained Random Forest model. Trains it if missing.
    """
    if not os.path.exists(MODEL_PATH):
        return train_and_save_model()
    try:
        with open(MODEL_PATH, 'rb') as f:
            return pickle.load(f)
    except Exception:
        return train_and_save_model()

# Ensure model is ready
model = get_model()
shap_explainer = None

def get_shap_explainer():
    """
    Lazily creates a SHAP TreeExplainer for the loaded Random Forest model.
    """
    global shap_explainer
    if shap_explainer is None:
        import shap
        shap_explainer = shap.TreeExplainer(model)
    return shap_explainer

def extract_class_shap_values(raw_shap_values, pred_code):
    """
    Normalizes SHAP output across package versions and selects the predicted class.
    """
    if isinstance(raw_shap_values, list):
        return np.array(raw_shap_values[pred_code][0], dtype=float)

    shap_array = np.array(raw_shap_values, dtype=float)

    if shap_array.ndim == 3:
        if shap_array.shape[1] == len(FEATURE_NAMES):
            return shap_array[0, :, pred_code]
        return shap_array[pred_code, 0, :]

    if shap_array.ndim == 2:
        return shap_array[0]

    return shap_array

def generate_shap_explanation(features, pred_code):
    """
    Generates per-prediction SHAP feature attributions for the predicted class.
    """
    explainer = get_shap_explainer()
    shap_values = extract_class_shap_values(explainer.shap_values(features), pred_code)
    feature_importance = {
        FEATURE_NAMES[idx]: round(float(shap_values[idx]), 6)
        for idx in range(len(FEATURE_NAMES))
    }
    top_features = sorted(
        feature_importance,
        key=lambda feature_name: abs(feature_importance[feature_name]),
        reverse=True
    )[:3]

    return {
        'topFeatures': top_features,
        'featureImportance': feature_importance
    }

def safe_float(value, default):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default

def has_numeric_value(data, key):
    if not isinstance(data, dict):
        return False
    try:
        float(data.get(key))
        return True
    except (TypeError, ValueError):
        return False

def predict_collision_ai(primary, secondary, conjunction_features=None):
    """
    Performs AI-based collision risk classification using Random Forest.
    """
    # 1. Feature Engineering
    if has_numeric_value(conjunction_features, 'minimumDistanceKm'):
        altitude_difference = safe_float(
            conjunction_features.get('minimumDistanceKm'),
            0.0
        )
    else:
        alt_p = safe_float(primary.get('altitudeKm'), 400)
        alt_s = safe_float(secondary.get('altitudeKm'), 400)
        altitude_difference = abs(alt_p - alt_s)
    
    if has_numeric_value(conjunction_features, 'relativeVelocityKmPerSec'):
        relative_velocity = safe_float(
            conjunction_features.get('relativeVelocityKmPerSec'),
            0.0
        )
    else:
        vel_p = safe_float(primary.get('velocityKmPerSec'), 7.7)
        vel_s = safe_float(secondary.get('velocityKmPerSec'), 7.7)
        relative_velocity = abs(vel_p - vel_s)
    
    inc_p = safe_float(primary.get('inclination'), 51.64)
    inc_s = safe_float(secondary.get('inclination'), 51.64)
    inclination_difference = abs(inc_p - inc_s)
    
    if has_numeric_value(conjunction_features, 'collisionProbability'):
        eccentricity_difference = safe_float(
            conjunction_features.get('collisionProbability'),
            0.0
        )
    else:
        ecc_p = safe_float(primary.get('eccentricity'), 0.001)
        ecc_s = safe_float(secondary.get('eccentricity'), 0.001)
        eccentricity_difference = abs(ecc_p - ecc_s)
    
    orbit_type = ORBIT_TYPE_MAP.get(primary.get('orbitType', 'LEO'), 0)
    object_type = OBJECT_TYPE_MAP.get(primary.get('objectType', 'Satellite'), 0)
    
    # 2. Format input features
    features = pd.DataFrame([{
        'altitudeDifference': altitude_difference,
        'relativeVelocity': relative_velocity,
        'inclinationDifference': inclination_difference,
        'eccentricityDifference': eccentricity_difference,
        'orbitType': orbit_type,
        'objectType': object_type
    }])
    
    # 3. Model Inference
    pred_code = int(model.predict(features)[0])
    proba_array = model.predict_proba(features)[0]
    probability = float(proba_array[pred_code])
    
    # Risk Level mapping
    ai_risk_level = RISK_LEVEL_MAP.get(pred_code, 'Low')
    
    # Calculate feature importances dynamically
    importances = model.feature_importances_
    sorted_idx = np.argsort(importances)[::-1]
    important_features = [FEATURE_NAMES[idx] for idx in sorted_idx[:3]]
    shap_explanation = generate_shap_explanation(features, pred_code)
    
    # Confidence scoring based on tree vote consensus
    confidence = float(np.mean(proba_array > 0.05))
    if confidence < 0.5:
        confidence = 0.5
    # Smooth confidence using probability
    confidence = float(round((confidence + probability) / 2.0, 4))
    
    return {
        'aiRiskLevel': ai_risk_level,
        'probability': round(probability, 4),
        'confidence': confidence,
        'importantFeatures': important_features,
        'shapExplanation': shap_explanation
    }
