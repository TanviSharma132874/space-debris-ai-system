const { calculatePredictionConfidence } = require('./confidenceScoringService');
const { generateMissionImpact } = require('./missionImpactService');
const { generateRecommendation } = require('./decisionSupportService');
const { validatePredictionInput } = require('./predictionValidationService');
const CollisionEvent = require('../models/CollisionEvent');
const RiskAssessment = require('../models/RiskAssessment');

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

const riskLevels = ['Low', 'Medium', 'High', 'Critical'];

const getObjectSummary = (object = {}) => ({
  id: object._id || object.id,
  name: object.name || 'Unknown',
  catalogNumber: object.catalogNumber || 'Unknown',
  objectType: object.objectType || 'Unknown',
  orbitType: object.orbitType || 'Unknown',
});

const incrementCount = (counts, key) => {
  const normalizedKey = key || 'Unknown';
  counts[normalizedKey] = (counts[normalizedKey] || 0) + 1;
};

const generateMissionSummaryReport = async () => {
  const collisionEvents = await CollisionEvent.find()
    .populate('primaryObject')
    .populate('secondaryObject')
    .sort({ predictedTime: -1 })
    .lean();
  const riskAssessments = await RiskAssessment.find()
    .sort({ assessedAt: -1 })
    .lean();

  const totalPredictions = collisionEvents.length;
  const riskDistribution = riskLevels.reduce((counts, riskLevel) => {
    counts[riskLevel] = 0;
    return counts;
  }, {});
  const objectCategoriesInvolved = {};
  let probabilityTotal = 0;
  let probabilityCount = 0;
  let maneuversRecommendedCount = 0;

  collisionEvents.forEach((event) => {
    const riskLevel = event.riskLevel || 'Low';
    riskDistribution[riskLevel] = (riskDistribution[riskLevel] || 0) + 1;

    [event.primaryObject, event.secondaryObject].forEach((object) => {
      incrementCount(objectCategoriesInvolved, object?.objectType);
    });

    if (Number.isFinite(Number(event.collisionProbability))) {
      probabilityTotal += Number(event.collisionProbability);
      probabilityCount += 1;
    }

    if (event.avoidanceRecommended) {
      maneuversRecommendedCount += 1;
    }
  });

  const confidenceValues = riskAssessments
    .map((assessment) => Number(assessment.aiConfidence))
    .filter((value) => Number.isFinite(value));
  const averageAiConfidence = confidenceValues.length
    ? confidenceValues.reduce((total, value) => total + value, 0) / confidenceValues.length
    : 0;

  return {
    generatedAt: new Date().toISOString(),
    missionSummary: {
      totalPredictions,
      highRiskEvents: riskDistribution.High || 0,
      criticalEvents: riskDistribution.Critical || 0,
      averageCollisionProbability: probabilityCount
        ? Math.round((probabilityTotal / probabilityCount) * 1000000) / 1000000
        : 0,
    },
    latestEvents: collisionEvents.slice(0, 10).map((event) => ({
      id: event._id,
      primaryObject: getObjectSummary(event.primaryObject),
      secondaryObject: getObjectSummary(event.secondaryObject),
      timeOfClosestApproach: event.predictedTime,
      minimumDistanceKm: event.minimumDistanceKm,
      relativeVelocityKmPerSec: event.relativeVelocityKmPerSec,
      collisionProbability: event.collisionProbability,
      riskLevel: event.riskLevel,
      avoidanceRecommended: event.avoidanceRecommended,
    })),
    riskAnalytics: {
      riskDistribution,
      objectCategoriesInvolved,
      averageAiConfidence:
        Math.round(averageAiConfidence * 10000) / 10000,
    },
    avoidanceSummary: {
      maneuversRecommendedCount,
      monitoredEventsCount: Math.max(totalPredictions - maneuversRecommendedCount, 0),
    },
    riskAssessmentSummary: {
      totalAssessments: riskAssessments.length,
      latestRecommendation: riskAssessments[0]?.recommendation || null,
    },
  };
};

module.exports = {
  generatePredictionReport,
  generateMissionSummaryReport,
};
