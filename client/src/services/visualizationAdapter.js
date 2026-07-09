/**
 * Color mapping for different risk levels.
 */
const COLOR_MAPPING = {
  Low: 'green',
  Medium: 'yellow',
  High: 'orange',
  Critical: 'red',
  Unknown: 'gray',
};

/**
 * Severity hierarchy to determine the highest risk if an object is involved in multiple predictions.
 */
const RISK_SEVERITY = {
  Unknown: 0,
  Low: 1,
  Medium: 2,
  High: 3,
  Critical: 4,
};

/**
 * Prepares orbital objects and collision data for future 3D rendering.
 *
 * @param {Object} params - The parameter object.
 * @param {Array} params.orbitalObjects - Array of all orbital objects.
 * @param {Array} params.predictions - Array of collision predictions/events.
 * @param {Object} params.trajectoriesByObjectId - Map of object IDs to propagated trajectory points.
 * @returns {Array} List of formatted visualization nodes.
 */
export function prepareVisualizationData({
  orbitalObjects = [],
  predictions = [],
  trajectoriesByObjectId = {},
}) {
  const objectRiskMap = new Map();

  // Helper to extract a string ID from various formats
  const getObjectId = (obj) => {
    if (!obj) return null;
    if (typeof obj === 'string') return obj;
    return obj._id || obj.id || null;
  };

  // 1. Map each object to its highest associated risk level from predictions
  predictions.forEach((prediction) => {
    if (!prediction) return;

    const primaryId = getObjectId(prediction.primaryObject);
    const secondaryId = getObjectId(prediction.secondaryObject);
    const riskLevel = prediction.riskLevel || 'Unknown';

    [primaryId, secondaryId].forEach((id) => {
      if (!id) return;

      const currentRisk = objectRiskMap.get(id) || 'Unknown';
      const currentSeverity = RISK_SEVERITY[currentRisk] ?? 0;
      const newSeverity = RISK_SEVERITY[riskLevel] ?? 0;

      if (newSeverity > currentSeverity) {
        objectRiskMap.set(id, riskLevel);
      }
    });
  });

  const isValidEciPosition = (eciPosition) => (
    Array.isArray(eciPosition) &&
    eciPosition.length >= 3 &&
    eciPosition.slice(0, 3).every((value) => Number.isFinite(Number(value)))
  );

  const getLatestTrajectoryPoint = (obj, id) => {
    const trajectory =
      trajectoriesByObjectId[id] ||
      trajectoriesByObjectId[obj.catalogNumber] ||
      obj.digitalTwin?.latestTrajectory ||
      obj.latestTrajectory ||
      [];

    if (!Array.isArray(trajectory) || trajectory.length === 0) {
      return null;
    }

    return trajectory[trajectory.length - 1];
  };

  const mapEciPositionToRadarPosition = (eciPosition, fallbackDistanceFactor) => {
    const [rawX, rawY, rawZ] = eciPosition.slice(0, 3).map(Number);
    const magnitude = Math.sqrt((rawX * rawX) + (rawY * rawY) + (rawZ * rawZ));

    if (!Number.isFinite(magnitude) || magnitude === 0) {
      return null;
    }

    const distanceFactor = Math.min(Math.max(fallbackDistanceFactor, 0.8), 1.35);

    return [
      (rawX / magnitude) * distanceFactor,
      (rawY / magnitude) * distanceFactor,
      (rawZ / magnitude) * distanceFactor,
    ];
  };

  // 2. Format every orbital object for 3D visualization
  return orbitalObjects.map((obj) => {
    const id = obj._id || obj.id;
    const riskLevel = objectRiskMap.get(id) || 'Unknown';
    const color = COLOR_MAPPING[riskLevel] || COLOR_MAPPING.Unknown;

    const angle = (Number(obj.catalogNumber || id?.charCodeAt(0) || 0) * 13) % 360;
    const rad = (angle * Math.PI) / 180;
    const distanceFactor = 1.1 + (Number(obj.altitudeKm ?? obj.altitude ?? 400) / 10000);
    const latestTrajectoryPoint = getLatestTrajectoryPoint(obj, id);
    const eciPosition =
      latestTrajectoryPoint?.eciPosition ||
      latestTrajectoryPoint?.eci_position;
    const scientificPosition = isValidEciPosition(eciPosition)
      ? mapEciPositionToRadarPosition(eciPosition, distanceFactor)
      : null;
    const position = scientificPosition || [
      Math.cos(rad) * distanceFactor,
      Math.sin(rad) * distanceFactor,
      Math.sin(rad * 2) * 0.3,
    ];

    return {
      id,
      name: obj.name,
      catalogNumber: obj.catalogNumber || 'N/A',
      objectType: obj.objectType || 'Unknown',
      orbitType: obj.orbitType || 'Unknown',
      altitudeKm: Number(obj.altitudeKm ?? obj.altitude ?? 0),
      velocityKmPerSec: Number(obj.velocityKmPerSec ?? obj.velocity ?? 0),
      riskLevel,
      color,
      position,
      positionSource: scientificPosition ? 'Scientific SGP4' : 'Fallback Geometry',
      trajectoryTimestamp: latestTrajectoryPoint?.timestamp,
    };
  });
}
