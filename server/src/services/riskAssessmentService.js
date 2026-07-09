const RiskAssessment = require('../models/RiskAssessment');

const buildMainRiskFactors = ({ aiPrediction, riskExplanation }) => {
  if (Array.isArray(aiPrediction?.importantFeatures) && aiPrediction.importantFeatures.length > 0) {
    return aiPrediction.importantFeatures;
  }

  if (Array.isArray(aiPrediction?.shapExplanation?.topFeatures) && aiPrediction.shapExplanation.topFeatures.length > 0) {
    return aiPrediction.shapExplanation.topFeatures;
  }

  if (Array.isArray(riskExplanation?.factors) && riskExplanation.factors.length > 0) {
    return riskExplanation.factors;
  }

  return undefined;
};

const createRiskAssessment = async ({
  collisionEvent,
  aiPrediction,
  recommendation,
  riskExplanation,
}) => {
  const collisionProbability = collisionEvent.collisionProbability;

  return RiskAssessment.create({
    collisionEvent: collisionEvent._id,
    riskScore: Math.round(collisionProbability * 10000) / 100,
    collisionProbability,
    riskLevel: collisionEvent.riskLevel,
    aiConfidence: aiPrediction?.confidence,
    recommendation,
    mainRiskFactors: buildMainRiskFactors({ aiPrediction, riskExplanation }),
    assessedAt: new Date(),
  });
};

module.exports = {
  createRiskAssessment,
};
