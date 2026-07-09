const { requestOrbitPropagation } = require('./scientificEngineService');

/**
 * Propagates an orbit using either the Python scientific engine or a placeholder geometric model.
 * 
 * @param {Object} params - The propagation parameters.
 * @param {Object} params.orbitalObject - The orbital object to propagate.
 * @param {number} params.durationMinutes - The total duration of the propagation in minutes.
 * @param {number} params.intervalMinutes - The time interval between trajectory points in minutes.
 * @returns {Promise<Object>} The propagation response.
 */
const propagateOrbit = async ({ orbitalObject, durationMinutes = 60, intervalMinutes = 5 }) => {
  const duration = Number(durationMinutes) || 60;
  const interval = Number(intervalMinutes) || 5;

  if (!orbitalObject) {
    throw new Error('Orbital object is required for propagation.');
  }

  const tleLine1 = orbitalObject.tle?.line1;
  const tleLine2 = orbitalObject.tle?.line2;

  // 1. Attempt to communicate with the Python scientific engine
  if (tleLine1 && tleLine2) {
    try {
      const pythonResult = await requestOrbitPropagation({
        orbitalObject: {
          ...orbitalObject,
          tleLine1,
          tleLine2,
        },
        durationMinutes: duration,
        intervalMinutes: interval,
      });

      if (pythonResult.connected && pythonResult.scientific) {
        return {
          supported: true,
          source: 'Scientific Engine',
          message: 'Orbit propagated using the Python scientific engine.',
          placeholderTrajectory: pythonResult.trajectory || pythonResult.placeholderTrajectory || [],
        };
      }
    } catch (error) {
      // Keep the existing geometric fallback when scientific propagation fails.
    }
  }

  // 2. Fallback: Generate a simple geometric preview trajectory
  const placeholderTrajectory = [];
  const steps = Math.floor(duration / interval);
  const startTimestamp = new Date();

  const altitude = orbitalObject.altitudeKm || 400;
  const velocity = orbitalObject.velocityKmPerSec || 7.7;

  for (let i = 0; i <= steps; i++) {
    const timeOffset = i * interval;
    const timestamp = new Date(startTimestamp.getTime() + timeOffset * 60 * 1000);

    // Generate a simple circular path around the Earth for visual preview.
    // This is purely geometric and not scientifically simulated.
    const angle = (timeOffset * velocity) / 100;
    const latitude = Math.sin(angle) * 70; // Map within typical orbital bounds
    const longitude = ((angle * 180 / Math.PI) % 360) - 180; // Wrap between -180 and 180

    placeholderTrajectory.push({
      timestamp: timestamp.toISOString(),
      timeOffsetMinutes: timeOffset,
      latitude: Math.round(latitude * 10000) / 10000,
      longitude: Math.round(longitude * 10000) / 10000,
      altitudeKm: altitude,
      velocityKmPerSec: velocity,
    });
  }

  return {
    supported: false,
    source: 'Placeholder Engine',
    message: 'Scientific orbit propagation is not yet configured.',
    placeholderTrajectory,
  };
};

module.exports = {
  propagateOrbit,
};
