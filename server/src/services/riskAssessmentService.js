const RiskAssessment = require('../models/RiskAssessment');
const { requestRiskAssessment } = require('./scientificEngineService');

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

const buildLocalRiskAssessment = ({
  collisionProbability,
  riskLevel,
  recommendation,
  aiPrediction,
  riskExplanation,
}) => ({
  riskScore: Math.round(collisionProbability * 10000) / 100,
  collisionProbability,
  riskLevel,
  recommendation,
  mainRiskFactors: buildMainRiskFactors({ aiPrediction, riskExplanation }),
});

const isValidRiskAssessmentResponse = (assessment) => (
  assessment &&
  Number.isFinite(assessment.riskScore) &&
  Number.isFinite(assessment.collisionProbability) &&
  typeof assessment.riskLevel === 'string' &&
  typeof assessment.recommendation === 'string' &&
  Array.isArray(assessment.mainRiskFactors)
);

const createRiskAssessment = async ({
  collisionEvent,
  aiPrediction,
  recommendation,
  riskExplanation,
}) => {
  const collisionProbability = collisionEvent.collisionProbability;
  let assessment;

  try {
    const serviceAssessment = await requestRiskAssessment({
      collisionProbability,
      riskLevel: collisionEvent.riskLevel,
      recommendation,
      aiPrediction,
      riskExplanation,
    });

    if (!isValidRiskAssessmentResponse(serviceAssessment)) {
      throw new Error('Invalid risk assessment service response');
    }

    assessment = serviceAssessment;
  } catch (error) {
    console.error('Risk assessment service failed:', error.message);
    assessment = buildLocalRiskAssessment({
      collisionProbability,
      riskLevel: collisionEvent.riskLevel,
      recommendation,
      aiPrediction,
      riskExplanation,
    });
  }

  return RiskAssessment.create({
    collisionEvent: collisionEvent._id,
    riskScore: assessment.riskScore,
    collisionProbability: assessment.collisionProbability,
    riskLevel: assessment.riskLevel,
    aiConfidence: aiPrediction?.confidence,
    recommendation: assessment.recommendation,
    mainRiskFactors: assessment.mainRiskFactors,
    assessedAt: new Date(),
  });
};

module.exports = {
  createRiskAssessment,
};
