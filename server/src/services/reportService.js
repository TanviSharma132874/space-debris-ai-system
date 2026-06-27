const { calculatePredictionConfidence } = require('./confidenceScoringService');
const { generateMissionImpact } = require('./missionImpactService');
const { generateRecommendation } = require('./decisionSupportService');
const { validatePredictionInput } = require('./predictionValidationService');

/**
 * Generates a structured operational report for a collision prediction event.
 *
 * @param {Object} prediction - The collision event populated with primary and secondary objects.
 * @returns {Object} The compiled structured JSON report.
 */
const generatePredictionReport = (prediction) => {
  if (!prediction) {
    throw new Error('Prediction event data is required to generate a report');
  }

  const primaryObject = prediction.primaryObject || {};
  const secondaryObject = prediction.secondaryObject || {};
  const riskLevel = prediction.riskLevel || 'Low';

  const recommendation = generateRecommendation(riskLevel);
  const missionImpact = generateMissionImpact(primaryObject, riskLevel);
  const confidence = calculatePredictionConfidence({
    altitudeDifference: prediction.minimumDistanceKm ?? 10,
    relativeVelocity: prediction.relativeVelocityKmPerSec ?? 5,
    riskLevel,
  });
  const validation = validatePredictionInput({
    primaryObject,
    secondaryObject,
  });

  return {
    predictionTimestamp: prediction.predictedTime || prediction.createdAt || new Date(),
    primaryObject: {
      id: primaryObject._id || primaryObject.id,
      name: primaryObject.name || 'Unknown',
      catalogNumber: primaryObject.catalogNumber || 'Unknown',
      objectType: primaryObject.objectType || 'Unknown',
      orbitType: primaryObject.orbitType || 'Unknown',
      altitudeKm: primaryObject.altitudeKm || 0,
      velocityKmPerSec: primaryObject.velocityKmPerSec || 0,
    },
    secondaryObject: {
      id: secondaryObject._id || secondaryObject.id,
      name: secondaryObject.name || 'Unknown',
      catalogNumber: secondaryObject.catalogNumber || 'Unknown',
      objectType: secondaryObject.objectType || 'Unknown',
      orbitType: secondaryObject.orbitType || 'Unknown',
      altitudeKm: secondaryObject.altitudeKm || 0,
      velocityKmPerSec: secondaryObject.velocityKmPerSec || 0,
    },
    riskLevel,
    recommendation,
    missionImpact: {
      missionCategory: missionImpact.missionCategory,
      impactLevel: missionImpact.impactLevel,
      impactDescription: missionImpact.impactDescription,
    },
    predictionConfidence: {
      confidenceScore: confidence.confidenceScore,
      confidenceLevel: confidence.confidenceLevel,
    },
    validationSummary: {
      isValid: validation.isValid,
      qualityLevel: validation.qualityLevel,
      warnings: validation.warnings,
    },
  };
};

module.exports = {
  generatePredictionReport,
};
