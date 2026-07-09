/**
 * Service to build a unified Digital Twin Workspace for each Orbital Object.
 * This service reuses existing services (Satellite Health, Orbital Events, Orbit Propagation, and Decision Support).
 */

const { calculateSatelliteHealth } = require('./satelliteHealthService');
const { detectOrbitalEvents } = require('./orbitalEventService');
const { propagateOrbit } = require('./orbitPropagationService');
const { generateRecommendation } = require('./decisionSupportService');
const CollisionEvent = require('../models/CollisionEvent');

/**
 * Builds the Digital Twin data structure for an orbital object.
 * @param {Object} orbitalObject - The orbital object document.
 * @returns {Promise<Object>} The Digital Twin model.
 */
async function buildDigitalTwin(orbitalObject) {
  if (!orbitalObject) {
    return null;
  }

  // 1. Profile
  const profile = {
    name: orbitalObject.name,
    catalogNumber: orbitalObject.catalogNumber,
    objectType: orbitalObject.objectType,
    orbitType: orbitalObject.orbitType,
    country: orbitalObject.country || 'Unknown',
    operator: orbitalObject.operator || 'Unknown',
    launchDate: orbitalObject.launchDate,
    altitudeKm: orbitalObject.altitudeKm,
    velocityKmPerSec: orbitalObject.velocityKmPerSec,
    inclination: orbitalObject.inclination,
    eccentricity: orbitalObject.eccentricity,
    status: orbitalObject.status
  };

  // 2. Health
  const health = calculateSatelliteHealth(orbitalObject);

  // 3. Orbital Events
  const orbitalEvents = detectOrbitalEvents(orbitalObject);

  // 4. Latest Trajectory Preview
  let latestTrajectory = [];
  try {
    const propagation = await propagateOrbit({
      orbitalObject,
      durationMinutes: 60,
      intervalMinutes: 5
    });
    latestTrajectory = propagation.placeholderTrajectory || [];
  } catch (err) {
    // Fallback if propagation fails
    latestTrajectory = [];
  }

  // 5. Latest Collision Prediction & Recommendation
  let latestPrediction = null;
  let latestRecommendation = 'Nominal operations. No collision threats detected.';

  try {
    const latestEvent = await CollisionEvent.findOne({
      $or: [
        { primaryObject: orbitalObject._id },
        { secondaryObject: orbitalObject._id }
      ]
    })
      .sort({ predictedTime: -1 })
      .lean();

    if (latestEvent) {
      latestPrediction = {
        predictedTime: latestEvent.predictedTime,
        minimumDistanceKm: latestEvent.minimumDistanceKm,
        relativeVelocityKmPerSec: latestEvent.relativeVelocityKmPerSec,
        collisionProbability: latestEvent.collisionProbability,
        riskLevel: latestEvent.riskLevel,
        status: latestEvent.status
      };
      // Reuse decisionSupportService recommendation
      latestRecommendation = generateRecommendation(latestEvent.riskLevel);
    }
  } catch (err) {
    // Ignore errors, keep defaults
  }

  // 6. Mission Status: Healthy, Monitoring, Warning, Critical
  let missionStatus = 'Healthy';
  const riskLevel = latestPrediction ? latestPrediction.riskLevel : 'Low';
  const healthScore = health ? health.healthScore : 100;
  const isSatellite = orbitalObject.objectType === 'Satellite';

  if (!isSatellite) {
    missionStatus = 'Monitoring'; // Debris, RocketBodies are always monitored
  } else if (orbitalObject.status === 'Inactive' || orbitalObject.status === 'Decayed') {
    missionStatus = 'Critical';
  } else if (riskLevel === 'Critical' || healthScore < 50 || orbitalEvents.severity === 'Critical') {
    missionStatus = 'Critical';
  } else if (riskLevel === 'High' || healthScore < 75 || orbitalEvents.severity === 'High') {
    missionStatus = 'Warning';
  } else if (riskLevel === 'Medium' || healthScore < 90 || orbitalEvents.events.length > 0) {
    missionStatus = 'Monitoring';
  } else {
    missionStatus = 'Healthy';
  }

  return {
    profile,
    health,
    orbitalEvents,
    latestTrajectory,
    latestPrediction,
    latestRecommendation,
    missionStatus
  };
}

module.exports = {
  buildDigitalTwin
};
