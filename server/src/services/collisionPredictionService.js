const {
  calculateAltitudeDifference,
  calculateRelativeVelocity,
  classifyOrbitRisk,
} = require('./orbitalAnalysisService');

const validateOrbitalObject = (orbitalObject, objectName) => {
  if (!orbitalObject || typeof orbitalObject !== 'object') {
    throw new Error(`${objectName} must be a valid orbital object`);
  }
};

const predictCollision = (primaryObject, secondaryObject) => {
  validateOrbitalObject(primaryObject, 'Primary object');
  validateOrbitalObject(secondaryObject, 'Secondary object');

  const altitudeDifference = calculateAltitudeDifference(
    primaryObject.altitudeKm,
    secondaryObject.altitudeKm
  );

  const relativeVelocity = calculateRelativeVelocity(
    primaryObject.velocityKmPerSec,
    secondaryObject.velocityKmPerSec
  );

  const riskLevel = classifyOrbitRisk(altitudeDifference, relativeVelocity);

  return {
    altitudeDifference,
    relativeVelocity,
    riskLevel,
  };
};

module.exports = {
  predictCollision,
};
