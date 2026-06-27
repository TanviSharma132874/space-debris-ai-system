const recommendationsByRiskLevel = {
  Low: 'Continue Monitoring',
  Medium: 'Increase Tracking Frequency',
  High: 'Prepare Collision Avoidance Plan',
  Critical: 'Immediate Collision Avoidance Maneuver Recommended',
};

const generateRecommendation = (riskLevel) => {
  return recommendationsByRiskLevel[riskLevel] || recommendationsByRiskLevel.Low;
};

module.exports = {
  generateRecommendation,
};
