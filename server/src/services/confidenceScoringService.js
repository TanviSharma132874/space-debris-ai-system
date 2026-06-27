/**
 * Calculates prediction confidence based on altitude difference, relative velocity, and risk level.
 *
 * @param {Object} params - Parameter object
 * @param {number} params.altitudeDifference - Proximity distance in kilometers
 * @param {number} params.relativeVelocity - Relative velocity in km/s
 * @param {string} params.riskLevel - Risk classification (Low, Medium, High, Critical)
 * @returns {Object} Deterministic confidence object containing score and level
 */
const calculatePredictionConfidence = ({
  altitudeDifference,
  relativeVelocity,
  riskLevel,
}) => {
  const diff = Number(altitudeDifference);
  const vel = Number(relativeVelocity);

  if (Number.isNaN(diff) || Number.isNaN(vel)) {
    return {
      confidenceScore: 50,
      confidenceLevel: 'Low',
    };
  }

  // 1. Establish base confidence score by risk classification clear-cutness
  let baseScore = 75; // Default to 'Medium'
  if (riskLevel === 'Critical') {
    baseScore = 95; // Very clear critical near-miss
  } else if (riskLevel === 'Low' && diff > 15) {
    baseScore = 92; // Clear safe pass
  } else if (riskLevel === 'Low') {
    baseScore = 88; // Likely safe pass
  } else if (riskLevel === 'High') {
    baseScore = 82; // Strong indicator
  } else if (riskLevel === 'Medium') {
    baseScore = 76; // Borderline indicators
  }

  // 2. Adjust score based on extreme or clear-cut distance thresholds
  let adjustment = 0;
  if (diff <= 0.1) {
    adjustment += 4; // Absolute close proximity increase certainty
  } else if (diff >= 40) {
    adjustment += 4; // Clear separation increase certainty
  }

  // 3. Adjust score based on velocity magnitude certainty
  if (vel >= 7.5) {
    adjustment += 1;
  }

  const confidenceScore = Math.max(0, Math.min(100, baseScore + adjustment));

  // 4. Map score to qualitative confidence levels
  let confidenceLevel = 'Low';
  if (confidenceScore >= 95) {
    confidenceLevel = 'Very High';
  } else if (confidenceScore >= 85) {
    confidenceLevel = 'High';
  } else if (confidenceScore >= 70) {
    confidenceLevel = 'Medium';
  }

  return {
    confidenceScore,
    confidenceLevel,
  };
};

module.exports = {
  calculatePredictionConfidence,
};
