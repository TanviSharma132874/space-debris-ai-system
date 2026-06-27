const validateNumber = (value, fieldName) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(`${fieldName} must be a valid number`);
  }
};

const calculateAltitudeDifference = (primaryAltitudeKm, secondaryAltitudeKm) => {
  validateNumber(primaryAltitudeKm, 'Primary altitude');
  validateNumber(secondaryAltitudeKm, 'Secondary altitude');

  return Math.abs(primaryAltitudeKm - secondaryAltitudeKm);
};

const calculateRelativeVelocity = (
  primaryVelocityKmPerSec,
  secondaryVelocityKmPerSec
) => {
  validateNumber(primaryVelocityKmPerSec, 'Primary velocity');
  validateNumber(secondaryVelocityKmPerSec, 'Secondary velocity');

  return Math.abs(primaryVelocityKmPerSec - secondaryVelocityKmPerSec);
};

const classifyOrbitRisk = (altitudeDifference, relativeVelocity) => {
  validateNumber(altitudeDifference, 'Altitude difference');
  validateNumber(relativeVelocity, 'Relative velocity');

  if (altitudeDifference <= 1 && relativeVelocity >= 5) {
    return 'Critical';
  }

  if (altitudeDifference <= 5 && relativeVelocity >= 3) {
    return 'High';
  }

  if (altitudeDifference <= 25 && relativeVelocity >= 1) {
    return 'Medium';
  }

  return 'Low';
};

module.exports = {
  calculateAltitudeDifference,
  calculateRelativeVelocity,
  classifyOrbitRisk,
};
