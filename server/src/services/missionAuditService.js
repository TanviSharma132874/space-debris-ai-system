/**
 * Service for Centralized Mission Audit & Decision Log.
 * Automatically intercepts operational events and stores them.
 */

const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, 'auditLogs.json');

let auditLogs = [];
try {
  if (fs.existsSync(logFilePath)) {
    auditLogs = JSON.parse(fs.readFileSync(logFilePath, 'utf8'));
  }
} catch (e) {
  auditLogs = [];
}

/**
 * Records a mission audit event.
 * @param {Object} event - The event data.
 * @param {string} event.eventType - 'Collision Prediction', 'Maneuver Simulation', etc.
 * @param {string} event.objectName - Name of the orbital object.
 * @param {string} [event.severity] - 'Normal', 'Warning', 'High', 'Critical'.
 * @param {string} event.summary - Summary explanation of the event.
 */
function recordMissionEvent(event) {
  if (!event || !event.eventType) return null;

  const newEvent = {
    eventType: event.eventType,
    objectName: event.objectName || 'System',
    timestamp: new Date().toISOString(),
    severity: event.severity || 'Normal',
    summary: event.summary || ''
  };

  // Add to start of array
  auditLogs.unshift(newEvent);

  // Keep max 100 entries
  if (auditLogs.length > 100) {
    auditLogs = auditLogs.slice(0, 100);
  }

  // Persist locally
  try {
    fs.writeFileSync(logFilePath, JSON.stringify(auditLogs, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write audit log to file', err);
  }

  return newEvent;
}

/**
 * Returns all recorded audit logs.
 * @returns {Array} Audit logs list.
 */
function getAuditLogs() {
  return auditLogs;
}

// ==========================================
// MONKEY-PATCHING OPERATIONS FOR ZERO-DUPLICATION
// ==========================================

// 1. Collision Prediction & Recommendation Generated
try {
  const collisionPredictionService = require('./collisionPredictionService');
  const originalPredict = collisionPredictionService.predictCollision;
  if (originalPredict) {
    collisionPredictionService.predictCollision = function (prim, sec) {
      const result = originalPredict.apply(this, arguments);
      if (result && prim && sec) {
        const severityMap = { Low: 'Normal', Medium: 'Warning', High: 'High', Critical: 'Critical' };
        const severity = severityMap[result.riskLevel] || 'Normal';

        recordMissionEvent({
          eventType: 'Collision Prediction',
          objectName: `${prim.name} / ${sec.name}`,
          severity,
          summary: `Collision risk classification completed: ${result.riskLevel}. Alt Diff: ${result.altitudeDifference} km, Rel Vel: ${result.relativeVelocity} km/s.`
        });

        // Recommendation Generated event
        const recMap = {
          Low: 'Continue Monitoring',
          Medium: 'Increase Tracking Frequency',
          High: 'Prepare Collision Avoidance Plan',
          Critical: 'Immediate Collision Avoidance Maneuver Recommended'
        };
        const recommendationText = recMap[result.riskLevel] || recMap.Low;

        recordMissionEvent({
          eventType: 'Recommendation Generated',
          objectName: `${prim.name} / ${sec.name}`,
          severity,
          summary: `Decision recommendation issued: "${recommendationText}".`
        });
      }
      return result;
    };
  }
} catch (err) {
  console.warn('Could not patch collisionPredictionService', err.message);
}

// 2. Maneuver Simulation
try {
  const maneuverSimulationService = require('./maneuverSimulationService');
  const originalSimulate = maneuverSimulationService.simulateAltitudeAdjustment;
  if (originalSimulate) {
    maneuverSimulationService.simulateAltitudeAdjustment = function (prim, sec, adj) {
      const result = originalSimulate.apply(this, arguments);
      if (result && prim && sec) {
        const severityMap = { Low: 'Normal', Medium: 'Warning', High: 'High', Critical: 'Critical' };
        const severity = severityMap[result.riskLevel] || 'Normal';

        recordMissionEvent({
          eventType: 'Maneuver Simulation',
          objectName: `${prim.name} / ${sec.name}`,
          severity,
          summary: `Maneuver simulation run with ${adj} km altitude adjustment. New risk level classified as: ${result.riskLevel}.`
        });
      }
      return result;
    };
  }
} catch (err) {
  console.warn('Could not patch maneuverSimulationService', err.message);
}

// 3. Scenario Saved
try {
  const scenarioService = require('./scenarioService');
  const originalSaveScenario = scenarioService.saveScenario;
  if (originalSaveScenario) {
    scenarioService.saveScenario = async function (data) {
      const result = await originalSaveScenario.apply(this, arguments);
      if (result) {
        recordMissionEvent({
          eventType: 'Scenario Saved',
          objectName: result.name,
          severity: 'Normal',
          summary: `Prediction scenario "${result.name}" successfully archived.`
        });
      }
      return result;
    };
  }
} catch (err) {
  console.warn('Could not patch scenarioService', err.message);
}

// 4. TLE Sync (CelesTrak Sync & Manual Import)
try {
  const celestrakSyncService = require('./celestrakSyncService');
  const originalSync = celestrakSyncService.syncGroup;
  if (originalSync) {
    celestrakSyncService.syncGroup = async function (groupName) {
      const result = await originalSync.apply(this, arguments);
      if (result) {
        recordMissionEvent({
          eventType: 'TLE Sync',
          objectName: `CelesTrak Feed: ${groupName}`,
          severity: 'Normal',
          summary: `CelesTrak group "${groupName}" synchronized. Imported: ${result.imported}, Skipped: ${result.skipped}, Errors: ${result.errors.length}.`
        });
      }
      return result;
    };
  }
} catch (err) {
  console.warn('Could not patch celestrakSyncService', err.message);
}

try {
  const tleImportService = require('./tleImportService');
  const originalParse = tleImportService.parseTLE;
  if (originalParse) {
    tleImportService.parseTLE = function (tleText) {
      const result = originalParse.apply(this, arguments);
      if (result && result.length > 0) {
        recordMissionEvent({
          eventType: 'TLE Sync',
          objectName: 'Manual TLE Import',
          severity: 'Normal',
          summary: `Manually parsed TLE dataset: ${result.length} objects processed.`
        });
      }
      return result;
    };
  }
} catch (err) {
  console.warn('Could not patch tleImportService', err.message);
}

// 5. Digital Twin Viewed
try {
  const digitalTwinService = require('./digitalTwinService');
  const originalBuild = digitalTwinService.buildDigitalTwin;
  if (originalBuild) {
    digitalTwinService.buildDigitalTwin = async function (orbitalObject) {
      const result = await originalBuild.apply(this, arguments);
      if (result && orbitalObject) {
        recordMissionEvent({
          eventType: 'Digital Twin Viewed',
          objectName: orbitalObject.name,
          severity: result.missionStatus === 'Healthy' ? 'Normal' : result.missionStatus,
          summary: `Digital Twin Workspace constructed for ${orbitalObject.name}. Status: ${result.missionStatus}.`
        });
      }
      return result;
    };
  }
} catch (err) {
  console.warn('Could not patch digitalTwinService', err.message);
}

module.exports = {
  recordMissionEvent,
  getAuditLogs
};
