const AVOIDANCE_SERVICE_URL = process.env.AVOIDANCE_SERVICE_URL || 'http://localhost:5004';

/**
 * Sends a request to the Python avoidance recommendation service.
 * Evaluates maneuver options for collision risk mitigation.
 * 
 * @param {Object} primaryObject - The primary orbital object data.
 * @param {Object} secondaryObject - The secondary orbital object data.
 * @param {Object} initialPrediction - The current collision prediction result.
 * @returns {Promise<Object>} The recommendations and optimal maneuver decision.
 */
const requestAvoidanceRecommendations = async (primaryObject, secondaryObject, initialPrediction) => {
  try {
    const response = await fetch(`${AVOIDANCE_SERVICE_URL}/recommend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        primaryObject,
        secondaryObject,
        initialPrediction,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP status code ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('AI Avoidance Recommendation service call failed:', error.message);
    
    // Return a safe fallback response if the microservice is down
    return {
      recommendations: [
        {
          maneuver: 'No maneuver',
          newAltitudeKm: primaryObject.altitudeKm,
          newVelocityKmPerSec: primaryObject.velocityKmPerSec,
          riskReduction: 'No Change',
          initialRisk: initialPrediction.riskLevel,
          newRisk: initialPrediction.riskLevel,
          newAiRisk: initialPrediction.aiPrediction?.aiRiskLevel || initialPrediction.riskLevel,
          newProbability: initialPrediction.aiPrediction?.probability || 0.1,
          newConfidence: initialPrediction.aiPrediction?.confidence || 0.5,
          deltaV: 0,
          fuelImpact: 0,
          missionImpact: 'Low',
          missionImpactDescription: 'Service unavailable. Current orbit configuration maintained.',
          score: 0,
          feasible: true
        }
      ],
      optimalManeuver: 'No maneuver',
      explanation: `Autonomous decision engine is offline: ${error.message}. Please check system status.`,
      currentFuelLevel: 100
    };
  }
};

module.exports = {
  requestAvoidanceRecommendations,
};
