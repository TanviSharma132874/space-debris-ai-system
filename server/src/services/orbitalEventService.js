/**
 * Service to detect orbital events for orbital objects.
 * This service is deterministic and does not use random values.
 */

/**
 * Detects orbital events for a given orbital object.
 * @param {Object} orbitalObject - The orbital object document.
 * @returns {Object} Detected events, overall severity, and recommendation.
 */
function detectOrbitalEvents(orbitalObject) {
  if (!orbitalObject) {
    return {
      events: [],
      severity: 'Normal',
      recommendation: 'No orbital object data provided.'
    };
  }

  const events = [];
  const status = orbitalObject.status || 'Active';
  const objectType = orbitalObject.objectType || 'Unknown';
  const catalogNumber = orbitalObject.catalogNumber || '';
  const altitudeKm = orbitalObject.altitudeKm || 0;
  const eccentricity = orbitalObject.eccentricity || 0;
  const launchDate = orbitalObject.launchDate;

  // Deterministic hash based on catalog number for variety
  const hash = catalogNumber.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // Age calculation
  let ageYears = 5;
  if (launchDate) {
    const ageMs = Date.now() - new Date(launchDate).getTime();
    ageYears = Math.max(0, ageMs / (1000 * 60 * 60 * 24 * 365.25));
  } else {
    ageYears = (hash % 12) + 1;
  }

  // Circular velocity check
  const GM = 398600.4418; // km^3/s^2
  const RE = 6378.1; // km
  const theoreticalVel = Math.sqrt(GM / (RE + altitudeKm));
  const actualVel = orbitalObject.velocityKmPerSec || 0;
  let dev = 0;
  if (theoreticalVel > 0 && actualVel > 0) {
    dev = Math.abs(actualVel - theoreticalVel) / theoreticalVel;
  }

  // 1. Decaying Orbit Risk
  if (status === 'Decayed' || (status === 'Active' && altitudeKm < 280)) {
    events.push('Decaying Orbit Risk');
  }

  // 2. Low Orbit Warning
  else if (status === 'Active' && altitudeKm < 350) {
    events.push('Low Orbit Warning');
  }

  // 3. Orbit Drift
  if (status === 'Active' && (hash % 15 === 0)) {
    events.push('Orbit Drift');
  }

  // 4. High Eccentricity
  if (eccentricity > 0.1) {
    events.push('High Eccentricity');
  }

  // 5. Velocity Anomaly
  if (status === 'Active' && actualVel > 0 && dev > 0.15) {
    events.push('Velocity Anomaly');
  }

  // 6. Aging Satellite
  if (objectType === 'Satellite' && ageYears > 8) {
    events.push('Aging Satellite');
  }

  // 7. Station Keeping Recommended
  if (objectType === 'Satellite' && status === 'Active') {
    if (altitudeKm < 420 || (hash % 8 === 0)) {
      // Don't duplicate if already decaying or too low, but add if general correction needed
      if (!events.includes('Decaying Orbit Risk') && !events.includes('Low Orbit Warning')) {
        events.push('Station Keeping Recommended');
      }
    }
  }

  // Determine Severity: Critical, High, Warning, Normal
  let severity = 'Normal';
  if (events.includes('Decaying Orbit Risk')) {
    severity = 'Critical';
  } else if (events.includes('Low Orbit Warning') || events.includes('Velocity Anomaly')) {
    severity = 'High';
  } else if (events.length > 0) {
    severity = 'Warning';
  }

  // Formulate recommendation based on severity and specific events
  let recommendation = 'Satellite orbit is stable. Continue nominal tracking and automated collision monitoring.';
  if (severity === 'Critical') {
    recommendation = 'Immediate orbit raising maneuver is required. Initiate thrusters to counteract drag and prevent reentry.';
  } else if (events.includes('Low Orbit Warning')) {
    recommendation = 'Schedule orbit correction maneuver within the next 48 hours to restore nominal operating altitude.';
  } else if (events.includes('Velocity Anomaly')) {
    recommendation = 'Perform diagnostic audit of propulsion and attitude control. Verify telemetry sensors for signal bias.';
  } else if (events.includes('Orbit Drift') || events.includes('Station Keeping Recommended')) {
    recommendation = 'Schedule routine station-keeping maneuver. Correct ground track drift and inclination at the next node crossing.';
  } else if (events.includes('High Eccentricity')) {
    recommendation = 'Analyze gravitational perturbations. Monitor solar radiation pressure impact on orbit parameters.';
  } else if (events.includes('Aging Satellite')) {
    recommendation = 'Prepare end-of-life deorbit plan. Deactivate non-essential instruments to maximize battery shelf-life.';
  }

  return {
    events,
    severity,
    recommendation
  };
}

module.exports = {
  detectOrbitalEvents
};
