/**
 * Service to calculate satellite health metrics based on orbital data.
 * This service is deterministic and does not use random values.
 */

/**
 * Calculates health status for a given orbital object.
 * @param {Object} orbitalObject - The orbital object document.
 * @returns {Object} Health metrics.
 */
function calculateSatelliteHealth(orbitalObject) {
  if (!orbitalObject) {
    return {
      healthScore: 0,
      batteryStatus: 'Dead',
      communicationStatus: 'None',
      thermalStatus: 'Cold',
      fuelLevel: 0,
      operationalStatus: 'Non-Operational',
      warnings: ['No orbital object data provided.']
    };
  }

  // If the object is not a Satellite, return placeholder/inactive health
  if (orbitalObject.objectType !== 'Satellite') {
    return {
      healthScore: 0,
      batteryStatus: 'None',
      communicationStatus: 'None',
      thermalStatus: 'Cold',
      fuelLevel: 0,
      operationalStatus: 'Non-Operational',
      warnings: ['Object is not a Satellite. Health monitoring is only available for active satellites.']
    };
  }

  const status = orbitalObject.status || 'Active';
  const catalogNumber = orbitalObject.catalogNumber || '';
  const altitudeKm = orbitalObject.altitudeKm || 0;
  const eccentricity = orbitalObject.eccentricity || 0;
  const launchDate = orbitalObject.launchDate;

  // Decayed or Inactive Satellites
  if (status === 'Decayed') {
    return {
      healthScore: 0,
      batteryStatus: 'Dead',
      communicationStatus: 'None',
      thermalStatus: 'Cold',
      fuelLevel: 0,
      operationalStatus: 'Non-Operational',
      warnings: ['Satellite has decayed from orbit.']
    };
  }

  if (status === 'Inactive') {
    return {
      healthScore: 10,
      batteryStatus: 'Dead',
      communicationStatus: 'None',
      thermalStatus: 'Cold',
      fuelLevel: 0,
      operationalStatus: 'Non-Operational',
      warnings: ['Satellite is inactive/decommissioned.']
    };
  }

  // Deterministic hash based on catalog number
  const hash = catalogNumber.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // Age calculation (15 years typical lifespan)
  let ageYears = 5;
  if (launchDate) {
    const ageMs = Date.now() - new Date(launchDate).getTime();
    ageYears = Math.max(0, ageMs / (1000 * 60 * 60 * 24 * 365.25));
  } else {
    // Fallback age based on catalog number (1 to 12 years)
    ageYears = (hash % 12) + 1;
  }

  // Fuel level: typical depletion based on age, low altitude burns more fuel (drag correction maneuvers)
  let fuelLevel = 100 - (ageYears / 15) * 100;
  if (altitudeKm < 400) {
    // Extra drag penalty
    fuelLevel -= (400 - altitudeKm) * 0.1;
  }
  fuelLevel = Math.max(0, Math.min(100, Math.round(fuelLevel)));

  // Battery status: Nominal, Low, Critical, Dead
  let batteryStatus = 'Nominal';
  if (fuelLevel < 10) {
    batteryStatus = 'Critical';
  } else if (fuelLevel < 25 || ageYears > 10) {
    batteryStatus = 'Low';
  } else {
    // Deterministic variant based on hash
    const batVal = hash % 20;
    if (batVal === 0) {
      batteryStatus = 'Low';
    } else if (batVal === 1) {
      batteryStatus = 'Critical';
    }
  }

  // Communication status: Optimal, Intermittent, Degraded, None
  let communicationStatus = 'Optimal';
  if (eccentricity > 0.4) {
    // Highly eccentric orbit might experience intermittent communication
    communicationStatus = 'Intermittent';
  } else {
    const commVal = hash % 15;
    if (commVal === 0) {
      communicationStatus = 'Degraded';
    } else if (commVal === 1) {
      communicationStatus = 'Intermittent';
    }
  }

  // Thermal status: Nominal, Warm, Cold, Overheating
  let thermalStatus = 'Nominal';
  if (altitudeKm < 300) {
    thermalStatus = 'Warm';
  } else {
    const thermVal = hash % 18;
    if (thermVal === 0) {
      thermalStatus = 'Warm';
    } else if (thermVal === 1) {
      thermalStatus = 'Cold';
    } else if (thermVal === 2) {
      thermalStatus = 'Overheating';
    }
  }

  // Compile warnings
  const warnings = [];
  if (fuelLevel < 15) {
    warnings.push('Critical fuel depletion.');
  } else if (fuelLevel < 35) {
    warnings.push('Low fuel levels detected.');
  }

  if (altitudeKm < 300) {
    warnings.push('Substantial orbital decay imminent due to low altitude drag.');
  }

  if (batteryStatus === 'Critical') {
    warnings.push('Battery charge levels critically low.');
  } else if (batteryStatus === 'Low') {
    warnings.push('Battery capacity degradation observed.');
  }

  if (communicationStatus === 'Degraded') {
    warnings.push('Telemetry signal attenuation.');
  } else if (communicationStatus === 'Intermittent') {
    warnings.push('Intermittent communication gaps in apogee.');
  }

  if (thermalStatus === 'Overheating') {
    warnings.push('Subsystem overheating detected.');
  } else if (thermalStatus === 'Cold') {
    warnings.push('Subsystem temperatures below nominal operating range.');
  }

  // Health score calculation (Start at 100, apply penalties)
  let healthScore = 100;

  // Fuel penalty (up to 30 points)
  if (fuelLevel < 50) {
    healthScore -= Math.round((50 - fuelLevel) * 0.6);
  }

  // Battery penalty
  if (batteryStatus === 'Critical') {
    healthScore -= 35;
  } else if (batteryStatus === 'Low') {
    healthScore -= 15;
  }

  // Communication penalty
  if (communicationStatus === 'Degraded') {
    healthScore -= 20;
  } else if (communicationStatus === 'Intermittent') {
    healthScore -= 10;
  }

  // Thermal penalty
  if (thermalStatus === 'Overheating') {
    healthScore -= 30;
  } else if (thermalStatus === 'Cold' || thermalStatus === 'Warm') {
    healthScore -= 10;
  }

  // Low altitude drag penalty
  if (altitudeKm < 350) {
    healthScore -= 10;
  }

  // Ensure health score is within [0, 100]
  healthScore = Math.max(0, Math.min(100, healthScore));

  // Determine operationalStatus: Operational, Degraded, Critical, Non-Operational
  let operationalStatus = 'Operational';
  if (healthScore >= 80) {
    operationalStatus = 'Operational';
  } else if (healthScore >= 50) {
    operationalStatus = 'Degraded';
  } else if (healthScore >= 20) {
    operationalStatus = 'Critical';
  } else {
    operationalStatus = 'Non-Operational';
  }

  return {
    healthScore,
    batteryStatus,
    communicationStatus,
    thermalStatus,
    fuelLevel,
    operationalStatus,
    warnings
  };
}

module.exports = {
  calculateSatelliteHealth
};
