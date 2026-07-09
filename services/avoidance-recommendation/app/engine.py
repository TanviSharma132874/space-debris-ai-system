import math
from datetime import datetime

GM = 398600.4418
RE = 6378.137

def calculate_fuel_level(primary):
    """
    Calculates the current fuel level percentage based on satellite age and altitude.
    Matches the satellite health service calculations.
    """
    launch_date_str = primary.get('launchDate')
    catalog_number = str(primary.get('catalogNumber', ''))
    altitude_km = float(primary.get('altitudeKm', 400.0))
    
    char_sum = sum(ord(char) for char in catalog_number)
    
    if launch_date_str:
        try:
            date_part = launch_date_str.split('T')[0]
            launch_date = datetime.strptime(date_part, '%Y-%m-%d')
            now = datetime.utcnow()
            age_days = (now - launch_date).days
            age_years = max(0.0, age_days / 365.25)
        except Exception:
            age_years = (char_sum % 12) + 1
    else:
        age_years = (char_sum % 12) + 1
        
    fuel_level = 100.0 - (age_years / 15.0) * 100.0
    if altitude_km < 400.0:
        fuel_level -= (400.0 - altitude_km) * 0.1
    return max(0.0, min(100.0, fuel_level))

def calculate_hohmann_dv(alt, new_alt, velocity):
    """
    Calculates the delta-V required for a Hohmann transfer from a circular orbit
    at 'alt' to a circular orbit at 'new_alt'.
    """
    r1 = RE + alt
    r2 = RE + new_alt
    v1 = math.sqrt(GM / r1)
    v2 = math.sqrt(GM / r2)
    
    dv1 = abs(v1 * (math.sqrt((2.0 * r2) / (r1 + r2)) - 1.0))
    dv2 = abs(v2 * (1.0 - math.sqrt((2.0 * r1) / (r1 + r2))))
    
    return (dv1 + dv2) * 1000.0  # Convert from km/s to m/s

def classify_risk(alt_diff, rel_vel):
    """
    Replicates the deterministic classifyOrbitRisk logic from the backend.
    """
    if alt_diff <= 1.0 and rel_vel >= 5.0:
        return 'Critical'
    if alt_diff <= 5.0 and rel_vel >= 3.0:
        return 'High'
    if alt_diff <= 25.0 and rel_vel >= 1.0:
        return 'Medium'
    return 'Low'

def evaluate_maneuver(primary, secondary, initial_prediction, option, current_fuel, call_ai_predict_fn):
    """
    Evaluates a single orbital maneuver option, returning details and recommendation score.
    """
    alt = float(primary.get('altitudeKm', 400.0))
    vel = float(primary.get('velocityKmPerSec', 7.7))
    
    sec_alt = float(secondary.get('altitudeKm', 400.0))
    sec_vel = float(secondary.get('velocityKmPerSec', 7.7))
    
    if option == 'No maneuver':
        new_alt = alt
        new_vel = vel
        dv = 0.0
        fuel_consumed_percent = 0.0
        mission_impact_level = 'Low'
        if initial_prediction.get('riskLevel') in ['High', 'Critical']:
            mission_impact_level = 'Critical'
            mission_impact_desc = "Nominal operations, but high collision risk threatens complete satellite destruction and total mission loss."
        else:
            mission_impact_desc = "Nominal operations. Continuing routine orbital tracking and safety monitoring."
            
    elif option == 'Raise orbit':
        new_alt = alt + 15.0
        new_vel = math.sqrt(GM / (RE + new_alt))
        dv = calculate_hohmann_dv(alt, new_alt, vel)
        fuel_consumed_percent = dv * 0.2
        mission_impact_level = 'Moderate'
        mission_impact_desc = "Satellite offline during Hohmann transfer (approx 4 hours). Permanent altitude adjustment requires update to downlink schedule."
        
    elif option == 'Lower orbit':
        new_alt = alt - 15.0
        new_vel = math.sqrt(GM / (RE + new_alt))
        dv = calculate_hohmann_dv(alt, new_alt, vel)
        fuel_consumed_percent = dv * 0.2
        mission_impact_level = 'Moderate'
        mission_impact_desc = "Satellite offline during transfer (approx 4 hours). Decreased orbital lifetime due to increased atmospheric drag at lower altitude."
        
    elif option == 'Small prograde burn':
        new_alt = alt + 2.0
        new_vel = math.sqrt(GM / (RE + new_alt))
        dv = 2.0  # m/s
        fuel_consumed_percent = dv * 0.2
        mission_impact_level = 'Low'
        mission_impact_desc = "Minimal operational disruption. Short-term telemetry interruption during burn."
        
    elif option == 'Small retrograde burn':
        new_alt = alt - 2.0
        new_vel = math.sqrt(GM / (RE + new_alt))
        dv = 2.0  # m/s
        fuel_consumed_percent = dv * 0.2
        mission_impact_level = 'Low'
        mission_impact_desc = "Minimal operational disruption. Short-term telemetry interruption during burn."
        
    else:
        raise ValueError(f"Unknown maneuver option: {option}")
        
    # Calculate new differences
    new_alt_diff = abs(new_alt - sec_alt)
    new_rel_vel = abs(new_vel - sec_vel)
    
    # New deterministic risk
    new_risk = classify_risk(new_alt_diff, new_rel_vel)
    
    # Calculate AI prediction for new configuration
    ai_risk = 'Low'
    ai_prob = 0.05
    ai_conf = 0.8
    
    if option != 'No maneuver':
        # Create modified primary object payload
        mod_primary = primary.copy()
        mod_primary['altitudeKm'] = new_alt
        mod_primary['velocityKmPerSec'] = new_vel
        
        ai_res = call_ai_predict_fn(mod_primary, secondary)
        ai_risk = ai_res.get('aiRiskLevel', 'Low')
        ai_prob = ai_res.get('probability', 0.05)
        ai_conf = ai_res.get('confidence', 0.8)
    else:
        # Re-use initial prediction values
        ai_pred = initial_prediction.get('aiPrediction') or {}
        ai_risk = ai_pred.get('aiRiskLevel', initial_prediction.get('riskLevel', 'Low'))
        ai_prob = ai_pred.get('probability', 0.1)
        ai_conf = ai_pred.get('confidence', 0.5)
        
    # Calculate Risk Reduction Score
    risk_mapping = {'Low': 0, 'Medium': 1, 'High': 2, 'Critical': 3}
    initial_risk_val = risk_mapping.get(initial_prediction.get('riskLevel', 'Low'), 0)
    new_risk_val = risk_mapping.get(new_risk, 0)
    
    if initial_risk_val == 0:
        risk_reduction_score = 100.0  # Already low risk, no reduction needed
    else:
        reduction_diff = initial_risk_val - new_risk_val
        if reduction_diff > 0:
            risk_reduction_score = (reduction_diff / initial_risk_val) * 100.0
        else:
            risk_reduction_score = 0.0
            
    # Safety Check: Maneuver is unsafe if new risk is High or Critical
    safety_satisfied = new_risk not in ['High', 'Critical'] and ai_risk not in ['High', 'Critical']
    
    # Fuel feasibility Check
    if fuel_consumed_percent > current_fuel:
        fuel_score = 0.0
        feasible = False
    else:
        fuel_score = max(0.0, 100.0 - (dv * 2.0))
        feasible = True
        
    # Mission Impact Score
    mission_mapping = {'Low': 90.0, 'Moderate': 65.0, 'High': 40.0, 'Critical': 10.0}
    mission_score = mission_mapping.get(mission_impact_level, 50.0)
    if option == 'No maneuver' and initial_prediction.get('riskLevel') == 'Low':
        mission_score = 100.0
        
    # Score formula: 50% Risk Reduction, 20% Fuel Score, 30% Mission Score
    overall_score = (risk_reduction_score * 0.5) + (fuel_score * 0.2) + (mission_score * 0.3)
    
    # Apply safety and feasibility overrides
    if not safety_satisfied:
        overall_score = min(overall_score, 20.0)  # Penalize options that leave the orbit in high risk
        
    if not feasible:
        overall_score = 0.0
        
    # Qualitative risk reduction text
    risk_reduction_text = f"{initial_prediction.get('riskLevel')} -> {new_risk}"
    if initial_prediction.get('riskLevel') == new_risk:
        risk_reduction_text = "No Change"
        
    return {
        'maneuver': option,
        'newAltitudeKm': round(new_alt, 2),
        'newVelocityKmPerSec': round(new_vel, 4),
        'riskReduction': risk_reduction_text,
        'initialRisk': initial_prediction.get('riskLevel'),
        'newRisk': new_risk,
        'newAiRisk': ai_risk,
        'newProbability': ai_prob,
        'newConfidence': ai_conf,
        'deltaV': round(dv, 2),
        'fuelImpact': round(fuel_consumed_percent, 2),
        'missionImpact': mission_impact_level,
        'missionImpactDescription': mission_impact_desc,
        'score': round(overall_score, 2),
        'feasible': feasible
    }
