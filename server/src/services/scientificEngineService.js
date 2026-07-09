const COLLISION_SERVICE_URL =
  process.env.COLLISION_SERVICE_URL ||
  process.env.SCIENTIFIC_ENGINE_URL ||
  'http://localhost:5002';

const AVOIDANCE_SERVICE_URL =
  process.env.AVOIDANCE_SERVICE_URL || 'http://localhost:5004';

const normalizeBaseUrl = (url) => url.replace(/\/+$/, '');

const postJson = async (baseUrl, path, payload, timeoutMs = 4000) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${normalizeBaseUrl(baseUrl)}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP status code ${response.status}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeout);
  }
};

const getDefaultAIPrediction = () => ({
  aiRiskLevel: 'Low',
  probability: 0.1,
  confidence: 0.5,
  importantFeatures: ['altitudeDifference', 'relativeVelocity'],
});

const requestAIPrediction = async (
  primaryObject,
  secondaryObject,
  conjunctionFeatures
) => {
  try {
    return await postJson(COLLISION_SERVICE_URL, '/predict-ai', {
      primaryObject,
      secondaryObject,
      conjunctionFeatures,
    });
  } catch (error) {
    console.error('AI prediction service failed:', error.message);
    return getDefaultAIPrediction();
  }
};

const requestOrbitPropagation = async (payload) => {
  try {
    const data = await postJson(COLLISION_SERVICE_URL, '/propagate', payload);
    return {
      connected: true,
      ...data,
    };
  } catch (error) {
    return {
      connected: false,
      message: `Scientific propagation service unavailable: ${error.message}`,
    };
  }
};

const requestAvoidanceRecommendations = async (
  primaryObject,
  secondaryObject,
  initialPrediction,
  conjunctionData
) => {
  try {
    return await postJson(AVOIDANCE_SERVICE_URL, '/recommend', {
      primaryObject,
      secondaryObject,
      initialPrediction,
      conjunctionData,
    });
  } catch (error) {
    console.error('AI Avoidance Recommendation service call failed:', error.message);

    return {
      recommendations: [
        {
          maneuver: 'No maneuver',
          newAltitudeKm: primaryObject.altitudeKm,
          newVelocityKmPerSec: primaryObject.velocityKmPerSec,
          riskReduction: 'No Change',
          initialRisk: initialPrediction.riskLevel,
          newRisk: initialPrediction.riskLevel,
          newAiRisk:
            initialPrediction.aiPrediction?.aiRiskLevel ||
            initialPrediction.riskLevel,
          newProbability: initialPrediction.aiPrediction?.probability || 0.1,
          newConfidence: initialPrediction.aiPrediction?.confidence || 0.5,
          deltaV: 0,
          fuelImpact: 0,
          missionImpact: 'Low',
          missionImpactDescription:
            'Service unavailable. Current orbit configuration maintained.',
          score: 0,
          feasible: true,
        },
      ],
      optimalManeuver: 'No maneuver',
      explanation: `Autonomous decision engine is offline: ${error.message}. Please check system status.`,
      currentFuelLevel: 100,
    };
  }
};

module.exports = {
  requestAIPrediction,
  requestAvoidanceRecommendations,
  requestOrbitPropagation,
};
