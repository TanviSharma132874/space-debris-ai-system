import os

from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/')
def index():
    return "Risk Assessment Service"

@app.route('/health')
def health():
    return {"status": "ok", "service": "risk-assessment"}

@app.route('/assess', methods=['POST'])
def assess():
    data = request.get_json() or {}
    
    collision_probability = float(data.get('collisionProbability', 0.0))
    risk_level = data.get('riskLevel', 'Low')
    recommendation = data.get('recommendation', 'Continue Monitoring')
    
    # Replicate current Node.js risk score calculation: Math.round(collisionProbability * 10000) / 100
    risk_score = round(collision_probability * 100.0, 2)
    
    # Replicate main risk factors extraction logic
    ai_prediction = data.get('aiPrediction') or {}
    risk_explanation = data.get('riskExplanation') or {}
    
    main_risk_factors = []
    important_features = ai_prediction.get('importantFeatures')
    if isinstance(important_features, list) and len(important_features) > 0:
        main_risk_factors = important_features
    else:
        top_features = ai_prediction.get('shapExplanation', {}).get('topFeatures')
        if isinstance(top_features, list) and len(top_features) > 0:
            main_risk_factors = top_features
        else:
            factors = risk_explanation.get('factors')
            if isinstance(factors, list) and len(factors) > 0:
                main_risk_factors = factors
                
    response = {
        "riskScore": risk_score,
        "riskLevel": risk_level,
        "collisionProbability": collision_probability,
        "mainRiskFactors": main_risk_factors,
        "recommendation": recommendation
    }
    return jsonify(response)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', '5003')))

