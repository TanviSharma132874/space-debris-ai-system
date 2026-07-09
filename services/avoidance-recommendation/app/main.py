import os
import requests
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from engine import calculate_fuel_level, evaluate_maneuver

app = Flask(__name__)

RISK_ORDER = ['Low', 'Medium', 'High', 'Critical']

def safe_float(value, default=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default

def clamp(value, min_value, max_value):
    return max(min_value, min(max_value, value))

def parse_tca(time_of_closest_approach):
    if not time_of_closest_approach:
        return None
    try:
        normalized = str(time_of_closest_approach).replace('Z', '+00:00')
        parsed = datetime.fromisoformat(normalized)
        if parsed.tzinfo:
            parsed = parsed.replace(tzinfo=None)
        return parsed
    except Exception:
        return None

def has_conjunction_data(conjunction_data):
    if not isinstance(conjunction_data, dict):
        return False
    required_fields = [
        'minimumDistanceKm',
        'relativeVelocityKmPerSec',
        'collisionProbability',
        'riskLevel'
    ]
    return all(field in conjunction_data for field in required_fields)

def reduce_risk_level(risk_level, steps):
    current_index = RISK_ORDER.index(risk_level) if risk_level in RISK_ORDER else 0
    return RISK_ORDER[max(0, current_index - steps)]

def get_time_to_tca_hours(time_of_closest_approach):
    tca = parse_tca(time_of_closest_approach)
    if not tca:
        return None
    return max(0.0, (tca - datetime.utcnow()).total_seconds() / 3600.0)

def calculate_delta_v_required(miss_distance_km, collision_probability, relative_velocity_km_s, urgency_factor):
    closeness_factor = clamp((5.0 - miss_distance_km) / 5.0, 0.0, 1.0)
    velocity_factor = clamp(relative_velocity_km_s / 15.0, 0.0, 1.0)
    delta_v = (
        0.5 +
        (5.0 * collision_probability) +
        (2.5 * closeness_factor) +
        (1.2 * velocity_factor) +
        (0.8 * urgency_factor)
    )
    return round(clamp(delta_v, 0.5, 10.0), 2)

def get_execution_time(time_of_closest_approach):
    tca = parse_tca(time_of_closest_approach)
    now = datetime.utcnow()
    if not tca:
        return (now + timedelta(minutes=30)).isoformat() + 'Z'

    minutes_to_tca = max(0.0, (tca - now).total_seconds() / 60.0)
    lead_minutes = clamp(minutes_to_tca * 0.5, 5.0, 720.0)
    return (tca - timedelta(minutes=lead_minutes)).isoformat() + 'Z'

def build_scientific_recommendations(primary, conjunction_data, current_fuel):
    risk_before = conjunction_data.get('riskLevel', 'Low')
    miss_distance = safe_float(conjunction_data.get('minimumDistanceKm'), 999.0)
    relative_velocity = safe_float(conjunction_data.get('relativeVelocityKmPerSec'), 0.0)
    collision_probability = clamp(safe_float(conjunction_data.get('collisionProbability'), 0.0), 0.0, 1.0)
    time_to_tca_hours = get_time_to_tca_hours(conjunction_data.get('timeOfClosestApproach'))
    urgency_factor = 0.0
    if time_to_tca_hours is not None:
        urgency_factor = clamp((24.0 - time_to_tca_hours) / 24.0, 0.0, 1.0)

    if risk_before == 'Low' or (collision_probability < 0.01 and miss_distance > 25.0):
        target_maneuver = 'No maneuver'
        risk_after = 'Low'
        target_steps = 0
    elif risk_before == 'Medium':
        target_maneuver = 'Small prograde burn'
        risk_after = 'Low'
        target_steps = 1
    elif risk_before == 'High':
        target_maneuver = 'Raise orbit'
        risk_after = 'Low' if collision_probability < 0.4 else 'Medium'
        target_steps = 2
    else:
        target_maneuver = 'Raise orbit'
        risk_after = 'Medium' if collision_probability >= 0.5 else 'Low'
        target_steps = 2

    delta_v_required = 0.0 if target_maneuver == 'No maneuver' else calculate_delta_v_required(
        miss_distance,
        collision_probability,
        relative_velocity,
        urgency_factor
    )
    recommended_execution_time = get_execution_time(conjunction_data.get('timeOfClosestApproach'))
    altitude = safe_float(primary.get('altitudeKm'), 400.0)
    velocity = safe_float(primary.get('velocityKmPerSec'), 7.7)

    maneuver_specs = {
        'No maneuver': {'altitudeShift': 0.0, 'dvFactor': 0.0, 'impact': 'Low'},
        'Raise orbit': {'altitudeShift': 15.0, 'dvFactor': 1.0, 'impact': 'Moderate'},
        'Lower orbit': {'altitudeShift': -15.0, 'dvFactor': 1.0, 'impact': 'Moderate'},
        'Small prograde burn': {'altitudeShift': 2.0, 'dvFactor': 0.45, 'impact': 'Low'},
        'Small retrograde burn': {'altitudeShift': -2.0, 'dvFactor': 0.45, 'impact': 'Low'},
    }

    recommendations = []
    risk_before_value = RISK_ORDER.index(risk_before) if risk_before in RISK_ORDER else 0
    confidence = round(clamp(0.65 + (collision_probability * 0.2) + (0.1 if miss_distance <= 5.0 else 0.0), 0.5, 0.95), 4)

    for maneuver, spec in maneuver_specs.items():
        option_delta_v = round(delta_v_required * spec['dvFactor'], 2)
        fuel_impact = round(option_delta_v * 0.2, 2)
        feasible = fuel_impact <= current_fuel

        if maneuver == 'No maneuver':
            option_risk_after = risk_before if risk_before != 'Low' else 'Low'
        elif maneuver == target_maneuver:
            option_risk_after = risk_after
        elif spec['dvFactor'] >= 1.0:
            option_risk_after = reduce_risk_level(risk_before, max(1, target_steps - 1))
        else:
            option_risk_after = reduce_risk_level(risk_before, 1)

        risk_after_value = RISK_ORDER.index(option_risk_after) if option_risk_after in RISK_ORDER else 0
        risk_reduction = max(0, risk_before_value - risk_after_value)
        risk_score = 100.0 if risk_before_value == 0 else (risk_reduction / risk_before_value) * 100.0
        fuel_score = max(0.0, 100.0 - (option_delta_v * 6.0))
        mission_score = 90.0 if spec['impact'] == 'Low' else 65.0

        if maneuver == 'No maneuver' and risk_before != 'Low':
            score = 15.0
        elif maneuver == target_maneuver:
            score = (risk_score * 0.6) + (fuel_score * 0.25) + (mission_score * 0.15)
        else:
            score = (risk_score * 0.45) + (fuel_score * 0.25) + (mission_score * 0.15)

        if not feasible:
            score = 0.0

        new_probability = collision_probability
        if option_risk_after == 'Low':
            new_probability = collision_probability * 0.15
        elif option_risk_after == 'Medium':
            new_probability = collision_probability * 0.4
        elif option_risk_after == 'High':
            new_probability = collision_probability * 0.7

        recommendations.append({
            'maneuver': maneuver,
            'newAltitudeKm': round(altitude + spec['altitudeShift'], 2),
            'newVelocityKmPerSec': round(velocity, 4),
            'riskReduction': 'No Change' if option_risk_after == risk_before else f"{risk_before} -> {option_risk_after}",
            'initialRisk': risk_before,
            'newRisk': option_risk_after,
            'newAiRisk': option_risk_after,
            'newProbability': round(clamp(new_probability, 0.0, 1.0), 6),
            'newConfidence': confidence,
            'deltaV': option_delta_v,
            'deltaVRequiredMs': option_delta_v,
            'fuelImpact': fuel_impact,
            'missionImpact': spec['impact'],
            'missionImpactDescription': 'Conjunction-driven maneuver based on SGP4 closest approach geometry.',
            'score': round(score, 2),
            'feasible': feasible,
            'recommendedExecutionTime': recommended_execution_time,
            'reason': f"Miss distance {miss_distance} km, Pc {collision_probability}, relative velocity {relative_velocity} km/s."
        })

    feasible_recommendations = [rec for rec in recommendations if rec['feasible']]
    optimal_rec = max(feasible_recommendations, key=lambda rec: rec['score']) if feasible_recommendations else recommendations[0]
    reason = (
        f"{optimal_rec['maneuver']} selected from SGP4 conjunction geometry: "
        f"miss distance {miss_distance} km, Pc {collision_probability}, "
        f"relative velocity {relative_velocity} km/s, risk {risk_before}."
    )
    explanation = (
        f"Scientific avoidance assessment used closest-approach distance, collision probability, "
        f"time before TCA, and relative velocity. Recommended maneuver: {optimal_rec['maneuver']}."
    )

    return {
        'recommendations': recommendations,
        'optimalManeuver': optimal_rec['maneuver'],
        'deltaVRequiredMs': optimal_rec['deltaVRequiredMs'],
        'recommendedExecutionTime': optimal_rec['recommendedExecutionTime'],
        'riskBefore': risk_before,
        'riskAfter': optimal_rec['newRisk'],
        'confidence': confidence,
        'reason': reason,
        'explanation': explanation,
        'currentFuelLevel': round(current_fuel, 2)
    }

def call_ai_prediction_api(primary_obj, secondary_obj):
    """
    Calls the collision-prediction service's /predict-ai API.
    Handles service discovery between Docker Compose environment and host network fallback.
    """
    payload = {
        'primaryObject': primary_obj,
        'secondaryObject': secondary_obj
    }
    
    # Try calling within docker network first, then fall back to localhost
    urls = [
        os.getenv('COLLISION_SERVICE_URL', 'http://collision-prediction:5002/predict-ai'),
        'http://localhost:5002/predict-ai',
        'http://127.0.0.1:5002/predict-ai'
    ]
    
    for url in urls:
        try:
            res = requests.post(url, json=payload, timeout=2.0)
            if res.status_code == 200:
                return res.json()
        except Exception:
            continue
            
    # Mock fallback if prediction service is completely unreachable
    # Uses the same logic from ml_prediction.py's physics thresholds
    alt_diff = abs(float(primary_obj.get('altitudeKm', 400)) - float(secondary_obj.get('altitudeKm', 400)))
    rel_vel = abs(float(primary_obj.get('velocityKmPerSec', 7.7)) - float(secondary_obj.get('velocityKmPerSec', 7.7)))
    
    score = 0
    if alt_diff < 15:
        score += 4
    elif alt_diff < 75:
        score += 2
    elif alt_diff < 250:
        score += 1
        
    if rel_vel > 9.0:
        score += 2
    elif rel_vel > 4.5:
        score += 1
        
    if score >= 5:
        ai_risk = 'Critical'
        prob = 0.9
    elif score >= 3:
        ai_risk = 'High'
        prob = 0.7
    elif score >= 1:
        ai_risk = 'Medium'
        prob = 0.4
    else:
        ai_risk = 'Low'
        prob = 0.1
        
    return {
        'aiRiskLevel': ai_risk,
        'probability': prob,
        'confidence': 0.85
    }

@app.route('/')
def index():
    return "Avoidance Recommendation Service"

@app.route('/health')
def health():
    return {"status": "ok", "service": "avoidance-recommendation"}

@app.route('/recommend', methods=['POST'])
def recommend():
    data = request.get_json() or {}
    primary = data.get('primaryObject')
    secondary = data.get('secondaryObject')
    initial_prediction = data.get('initialPrediction')
    conjunction_data = data.get('conjunctionData')
    
    if not primary or not secondary or not initial_prediction:
        return jsonify({"error": "primaryObject, secondaryObject, and initialPrediction are required"}), 400
        
    # Calculate current fuel level
    current_fuel = calculate_fuel_level(primary)

    if has_conjunction_data(conjunction_data):
        return jsonify(build_scientific_recommendations(
            primary,
            conjunction_data,
            current_fuel
        ))
    
    # Evaluate the 5 options
    options = [
        'No maneuver',
        'Raise orbit',
        'Lower orbit',
        'Small prograde burn',
        'Small retrograde burn'
    ]
    
    recommendations = []
    for opt in options:
        try:
            rec = evaluate_maneuver(
                primary=primary,
                secondary=secondary,
                initial_prediction=initial_prediction,
                option=opt,
                current_fuel=current_fuel,
                call_ai_predict_fn=call_ai_prediction_api
            )
            recommendations.append(rec)
        except Exception as e:
            # Skip invalid options, or log
            print(f"Error evaluating maneuver {opt}: {e}")
            
    # Select the optimal maneuver (highest score)
    feasible_recs = [r for r in recommendations if r['feasible']]
    if feasible_recs:
        optimal_rec = max(feasible_recs, key=lambda x: x['score'])
        optimal_maneuver = optimal_rec['maneuver']
        optimal_score = optimal_rec['score']
    else:
        optimal_rec = None
        optimal_maneuver = 'No maneuver'
        optimal_score = 0.0
        
    # Generate explanation
    initial_risk = initial_prediction.get('riskLevel', 'Low')
    
    if initial_risk == 'Low':
        explanation = ("Maneuver assessment complete. No action is required since the current collision risk level is Low. "
                       "Choosing 'No maneuver' maintains routine flight configurations and avoids unnecessary fuel expenditure.")
    elif not optimal_rec or optimal_score <= 25.0:
        explanation = ("CRITICAL WARNING: The autonomous engine could not find an orbital maneuver that safely resolves the risk "
                       "within the satellite's operational constraints or fuel limits. Immediate manual operator override and flight controller "
                       "intervention is required.")
    else:
        # A valid optimal maneuver was selected
        if optimal_maneuver == 'No maneuver':
            explanation = ("Although collision risk is elevated, the decision engine determined that no maneuver is feasible or "
                           "safe under current power/fuel constraints. Please review manual emergency orbital parameters.")
        else:
            impact_lc = optimal_rec['missionImpact'].lower()
            explanation = (f"The AI decision engine recommends a '{optimal_maneuver}' as the optimal mitigation strategy (Recommendation Score: {optimal_score}/100). "
                           f"This action is expected to reduce the collision risk level to Low ({optimal_rec['riskReduction']}) by adjusting the altitude to "
                           f"{optimal_rec['newAltitudeKm']} km. It requires a delta-V of {optimal_rec['deltaV']} m/s, consuming only "
                           f"{optimal_rec['fuelImpact']}% of the satellite's capacity with a {impact_lc} mission impact. ")
            
            # Add comparison context
            other_recs = [r for r in feasible_recs if r['maneuver'] != optimal_maneuver and r['maneuver'] != 'No maneuver' and r['score'] > 25.0]
            if other_recs:
                best_alternative = max(other_recs, key=lambda x: x['score'])
                explanation += (f"Alternative maneuver '{best_alternative['maneuver']}' was rejected because it received a lower score of "
                                f"{best_alternative['score']}/100 due to higher fuel impact ({best_alternative['fuelImpact']}% fuel) or greater mission degradation.")
            else:
                explanation += "No other options successfully mitigate the risk while keeping the satellite within its safe operational parameters."

    response = {
        'recommendations': recommendations,
        'optimalManeuver': optimal_maneuver,
        'explanation': explanation,
        'currentFuelLevel': round(current_fuel, 2)
    }
    
    return jsonify(response)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', '5004')))
