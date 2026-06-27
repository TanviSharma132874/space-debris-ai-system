const { predictCollision } = require('../services/collisionPredictionService');
const { generateRecommendation } = require('../services/decisionSupportService');
const {
  generateRiskExplanation,
} = require('../services/riskExplainabilityService');
const {
  simulateAltitudeAdjustment,
} = require('../services/maneuverSimulationService');
const { generateMissionImpact } = require('../services/missionImpactService');
const {
  generatePredictionTimeline,
  generateAnalyticsSummary,
} = require('../services/predictionTimelineService');
const CollisionEvent = require('../models/CollisionEvent');
const OrbitalObject = require('../models/OrbitalObject');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { calculatePredictionConfidence } = require('../services/confidenceScoringService');
const { validatePredictionInput } = require('../services/predictionValidationService');
const { prioritizeCollisionEvents } = require('../services/riskPrioritizationService');

const collisionProbabilityByRiskLevel = {
  Low: 0.1,
  Medium: 0.4,
  High: 0.7,
  Critical: 0.9,
};

const predictCollisionRisk = async (req, res) => {
  try {
    const { primaryObject, secondaryObject } = req.body;

    if (!primaryObject || !secondaryObject) {
      return errorResponse(
        res,
        400,
        'Primary object and secondary object are required'
      );
    }

    const primaryOrbitalObject = await OrbitalObject.findById(primaryObject);
    const secondaryOrbitalObject = await OrbitalObject.findById(secondaryObject);

    if (!primaryOrbitalObject || !secondaryOrbitalObject) {
      return errorResponse(res, 404, 'One or more orbital objects were not found');
    }

    const prediction = predictCollision(primaryOrbitalObject, secondaryOrbitalObject);
    const recommendation = generateRecommendation(prediction.riskLevel);
    const riskExplanation = generateRiskExplanation(prediction);
    const missionImpact = generateMissionImpact(
      primaryOrbitalObject,
      prediction.riskLevel
    );
    const confidence = calculatePredictionConfidence({
      altitudeDifference: prediction.altitudeDifference,
      relativeVelocity: prediction.relativeVelocity,
      riskLevel: prediction.riskLevel,
    });
    const validation = validatePredictionInput({
      primaryObject: primaryOrbitalObject,
      secondaryObject: secondaryOrbitalObject,
    });
    const collisionEvent = await CollisionEvent.create({
      primaryObject,
      secondaryObject,
      predictedTime: new Date(),
      minimumDistanceKm: prediction.altitudeDifference,
      relativeVelocityKmPerSec: prediction.relativeVelocity,
      collisionProbability:
        collisionProbabilityByRiskLevel[prediction.riskLevel] || 0.1,
      riskLevel: prediction.riskLevel,
      avoidanceRecommended: ['High', 'Critical'].includes(prediction.riskLevel),
    });

    return successResponse(
      res,
      200,
      'Collision risk predicted successfully',
      {
        ...prediction,
        recommendation,
        riskExplanation,
        missionImpact,
        collisionEvent,
        confidence,
        validation,
      }
    );
  } catch (error) {
    return errorResponse(res, 400, error.message);
  }
};

const simulateCollisionManeuver = async (req, res) => {
  try {
    const { primaryObject, secondaryObject, altitudeAdjustmentKm } = req.body;
    const parsedAltitudeAdjustment = Number(altitudeAdjustmentKm);

    if (!primaryObject || !secondaryObject || Number.isNaN(parsedAltitudeAdjustment)) {
      return errorResponse(
        res,
        400,
        'Primary object, secondary object, and altitude adjustment are required'
      );
    }

    const primaryOrbitalObject = await OrbitalObject.findById(primaryObject);
    const secondaryOrbitalObject = await OrbitalObject.findById(secondaryObject);

    if (!primaryOrbitalObject || !secondaryOrbitalObject) {
      return errorResponse(res, 404, 'One or more orbital objects were not found');
    }

    const prediction = simulateAltitudeAdjustment(
      primaryOrbitalObject,
      secondaryOrbitalObject,
      parsedAltitudeAdjustment
    );
    const recommendation = generateRecommendation(prediction.riskLevel);
    const riskExplanation = generateRiskExplanation(prediction);
    const confidence = calculatePredictionConfidence({
      altitudeDifference: prediction.altitudeDifference,
      relativeVelocity: prediction.relativeVelocity,
      riskLevel: prediction.riskLevel,
    });
    const validation = validatePredictionInput({
      primaryObject: primaryOrbitalObject,
      secondaryObject: secondaryOrbitalObject,
    });

    return successResponse(
      res,
      200,
      'Maneuver simulation completed successfully',
      {
        ...prediction,
        recommendation,
        riskExplanation,
        confidence,
        validation,
      }
    );
  } catch (error) {
    return errorResponse(res, 400, error.message);
  }
};

const getPredictionTimeline = async (req, res) => {
  try {
    const { objectId, prioritized } = req.query;
    const query = objectId
      ? {
          $or: [
            { primaryObject: objectId },
            { secondaryObject: objectId },
          ],
        }
      : {};

    const collisionEvents = await CollisionEvent.find(query)
      .populate('primaryObject')
      .populate('secondaryObject')
      .lean();
    const enrichedPredictions = collisionEvents.map((collisionEvent) => {
      const riskLevel = collisionEvent.riskLevel;
      const primaryObj = collisionEvent.primaryObject || {};
      const missionImpact = generateMissionImpact(primaryObj, riskLevel);
      const confidence = calculatePredictionConfidence({
        altitudeDifference: collisionEvent.minimumDistanceKm,
        relativeVelocity: collisionEvent.relativeVelocityKmPerSec,
        riskLevel,
      });
      return {
        ...collisionEvent,
        recommendation: generateRecommendation(riskLevel),
        missionImpact,
        confidence,
      };
    });

    if (prioritized === 'true') {
      const prioritizedEvents = prioritizeCollisionEvents(enrichedPredictions);
      return successResponse(
        res,
        200,
        'Prioritized collision events retrieved successfully',
        prioritizedEvents
      );
    }

    const timeline = generatePredictionTimeline(enrichedPredictions);

    return successResponse(
      res,
      200,
      'Prediction timeline retrieved successfully',
      timeline
    );
  } catch (error) {
    return errorResponse(res, 500, 'Failed to retrieve prediction timeline');
  }
};

const getAnalyticsSummary = async (req, res) => {
  try {
    const collisionEvents = await CollisionEvent.find().lean();
    const analyticsSummary = generateAnalyticsSummary(collisionEvents);

    return successResponse(
      res,
      200,
      'Analytics summary retrieved successfully',
      analyticsSummary
    );
  } catch (error) {
    return errorResponse(res, 500, 'Failed to retrieve analytics summary');
  }
};

module.exports = {
  predictCollisionRisk,
  simulateCollisionManeuver,
  getPredictionTimeline,
  getAnalyticsSummary,
};
