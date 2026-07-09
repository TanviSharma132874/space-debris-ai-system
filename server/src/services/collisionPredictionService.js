const {
  calculateAltitudeDifference,
  calculateRelativeVelocity,
  classifyOrbitRisk,
} = require('./orbitalAnalysisService');
const { requestOrbitPropagation } = require('./scientificEngineService');

const conjunctionDurationMinutes = 60;
const conjunctionIntervalMinutes = 5;
const combinedHardBodyRadiusKm = 0.02;
const positionUncertaintyKm = 1.0;

const validateOrbitalObject = (orbitalObject, objectName) => {
  if (!orbitalObject || typeof orbitalObject !== 'object') {
    throw new Error(`${objectName} must be a valid orbital object`);
  }
};

const classifyConjunctionRisk = (minimumDistanceKm) => {
  if (minimumDistanceKm < 1) return 'Critical';
  if (minimumDistanceKm <= 5) return 'High';
  if (minimumDistanceKm <= 25) return 'Medium';
  return 'Low';
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const calculateCollisionProbability = ({
  minimumDistanceKm,
  relativeVelocityKmPerSec,
}) => {
  const missDistanceKm = Number(minimumDistanceKm);
  const relativeVelocity = Number(relativeVelocityKmPerSec);

  if (!Number.isFinite(missDistanceKm) || missDistanceKm < 0) {
    return 0;
  }

  if (missDistanceKm <= combinedHardBodyRadiusKm) {
    return 0.999999;
  }

  const normalizedMissDistance = missDistanceKm / positionUncertaintyKm;
  const uncertaintyOverlap = Math.exp(
    -0.5 * normalizedMissDistance * normalizedMissDistance
  );
  const hardBodyModifier = clamp(
    combinedHardBodyRadiusKm / missDistanceKm,
    0.02,
    1
  );
  const velocityModifier = Number.isFinite(relativeVelocity)
    ? clamp(1 / (1 + (relativeVelocity / 15)), 0.35, 1)
    : 0.5;
  const probability =
    uncertaintyOverlap * ((0.75 * hardBodyModifier) + 0.25) * velocityModifier;

  return Math.round(clamp(probability, 0, 1) * 1000000) / 1000000;
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
    minimumDistanceKm: altitudeDifference,
    relativeVelocityKmPerSec: relativeVelocity,
    timeOfClosestApproach: new Date().toISOString(),
    scientific: false,
    source: 'Altitude/velocity fallback',
    riskLevel,
  };
};

const getStoredTLE = (orbitalObject) => ({
  tleLine1: orbitalObject.tle?.line1,
  tleLine2: orbitalObject.tle?.line2,
});

const withFlatTLE = (orbitalObject) => {
  const { tleLine1, tleLine2 } = getStoredTLE(orbitalObject);
  return {
    ...(orbitalObject.toObject ? orbitalObject.toObject() : orbitalObject),
    tleLine1,
    tleLine2,
  };
};

const hasStoredTLE = (orbitalObject) => {
  const { tleLine1, tleLine2 } = getStoredTLE(orbitalObject);
  return Boolean(tleLine1 && tleLine2);
};

const getEciPosition = (point) => point.eciPosition || point.eci_position;
const getEciVelocity = (point) => point.eciVelocity || point.eci_velocity;

const isValidVector = (vector) => (
  Array.isArray(vector) &&
  vector.length >= 3 &&
  vector.slice(0, 3).every((value) => Number.isFinite(Number(value)))
);

const vectorDistance = (primaryVector, secondaryVector) => {
  const dx = primaryVector[0] - secondaryVector[0];
  const dy = primaryVector[1] - secondaryVector[1];
  const dz = primaryVector[2] - secondaryVector[2];
  return Math.sqrt((dx * dx) + (dy * dy) + (dz * dz));
};

const getTimestampKey = (point) => {
  if (!point.timestamp) return null;
  const time = new Date(point.timestamp).getTime();
  if (Number.isNaN(time)) return null;
  return new Date(Math.round(time / 60000) * 60000).toISOString();
};

const getTrajectoryPointMap = (trajectory) => {
  const map = new Map();
  trajectory.forEach((point) => {
    const key = getTimestampKey(point);
    if (key) {
      map.set(key, point);
    }
  });
  return map;
};

const findClosestApproach = (primaryTrajectory, secondaryTrajectory) => {
  const secondaryByTimestamp = getTrajectoryPointMap(secondaryTrajectory);
  let closestApproach = null;

  primaryTrajectory.forEach((primaryPoint, index) => {
    const timestampKey = getTimestampKey(primaryPoint);
    const secondaryPoint = timestampKey
      ? secondaryByTimestamp.get(timestampKey) || secondaryTrajectory[index]
      : secondaryTrajectory[index];

    if (!secondaryPoint) return;

    const primaryPosition = getEciPosition(primaryPoint);
    const secondaryPosition = getEciPosition(secondaryPoint);
    const primaryVelocity = getEciVelocity(primaryPoint);
    const secondaryVelocity = getEciVelocity(secondaryPoint);

    if (
      !isValidVector(primaryPosition) ||
      !isValidVector(secondaryPosition) ||
      !isValidVector(primaryVelocity) ||
      !isValidVector(secondaryVelocity)
    ) {
      return;
    }

    const minimumDistanceKm = vectorDistance(primaryPosition, secondaryPosition);
    const relativeVelocityKmPerSec = vectorDistance(primaryVelocity, secondaryVelocity);

    if (!closestApproach || minimumDistanceKm < closestApproach.minimumDistanceKm) {
      closestApproach = {
        minimumDistanceKm,
        relativeVelocityKmPerSec,
        timeOfClosestApproach: primaryPoint.timestamp,
      };
    }
  });

  if (!closestApproach) {
    throw new Error('No comparable propagated ECI trajectory points were returned');
  }

  return closestApproach;
};

const propagateForConjunction = async (orbitalObject) => {
  const result = await requestOrbitPropagation({
    orbitalObject: withFlatTLE(orbitalObject),
    durationMinutes: conjunctionDurationMinutes,
    intervalMinutes: conjunctionIntervalMinutes,
  });

  if (!result.connected || !result.scientific || !Array.isArray(result.trajectory)) {
    throw new Error(result.message || 'Scientific propagation failed');
  }

  return result.trajectory;
};

const predictScientificCollision = async (primaryObject, secondaryObject) => {
  validateOrbitalObject(primaryObject, 'Primary object');
  validateOrbitalObject(secondaryObject, 'Secondary object');

  if (!hasStoredTLE(primaryObject) || !hasStoredTLE(secondaryObject)) {
    return predictCollision(primaryObject, secondaryObject);
  }

  try {
    const [primaryTrajectory, secondaryTrajectory] = await Promise.all([
      propagateForConjunction(primaryObject),
      propagateForConjunction(secondaryObject),
    ]);
    const closestApproach = findClosestApproach(primaryTrajectory, secondaryTrajectory);
    const minimumDistanceKm = Math.round(closestApproach.minimumDistanceKm * 10000) / 10000;
    const relativeVelocityKmPerSec =
      Math.round(closestApproach.relativeVelocityKmPerSec * 10000) / 10000;
    const riskLevel = classifyConjunctionRisk(minimumDistanceKm);

    return {
      altitudeDifference: minimumDistanceKm,
      relativeVelocity: relativeVelocityKmPerSec,
      minimumDistanceKm,
      relativeVelocityKmPerSec,
      timeOfClosestApproach: closestApproach.timeOfClosestApproach,
      scientific: true,
      source: 'SGP4 closest approach',
      riskLevel,
    };
  } catch (error) {
    return predictCollision(primaryObject, secondaryObject);
  }
};

module.exports = {
  calculateCollisionProbability,
  predictCollision,
  predictScientificCollision,
};
