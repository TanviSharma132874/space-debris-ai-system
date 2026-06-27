const getPredictionTimestamp = (prediction) => {
  return prediction.timestamp || prediction.predictedTime || prediction.createdAt;
};

const generatePredictionTimeline = (predictions) => {
  return [...predictions]
    .sort(
      (firstPrediction, secondPrediction) =>
        new Date(getPredictionTimestamp(firstPrediction)) -
        new Date(getPredictionTimestamp(secondPrediction))
    )
    .map((prediction) => ({
      timestamp: getPredictionTimestamp(prediction),
      riskLevel: prediction.riskLevel,
      recommendation: prediction.recommendation,
      missionImpact: prediction.missionImpact,
    }));
};

const generateAnalyticsSummary = (predictions) => {
  const totalRelativeVelocity = predictions.reduce(
    (total, prediction) =>
      total + (prediction.relativeVelocityKmPerSec || prediction.relativeVelocity || 0),
    0
  );

  return {
    totalPredictions: predictions.length,
    lowRiskCount: predictions.filter((prediction) => prediction.riskLevel === 'Low')
      .length,
    mediumRiskCount: predictions.filter(
      (prediction) => prediction.riskLevel === 'Medium'
    ).length,
    highRiskCount: predictions.filter((prediction) => prediction.riskLevel === 'High')
      .length,
    criticalRiskCount: predictions.filter(
      (prediction) => prediction.riskLevel === 'Critical'
    ).length,
    averageRelativeVelocity:
      predictions.length === 0 ? 0 : totalRelativeVelocity / predictions.length,
  };
};

module.exports = {
  generatePredictionTimeline,
  generateAnalyticsSummary,
};
