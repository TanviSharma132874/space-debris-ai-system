/**
 * Service for Centralized Mission Audit & Decision Log.
 * Automatically intercepts operational events and stores them.
 */

const AuditLog = require('../models/AuditLog');

/**
 * Records a mission audit event.
 * @param {Object} event - The event data.
 * @param {string} event.eventType - 'Collision Prediction', 'Maneuver Simulation', etc.
 * @param {string} event.objectName - Name of the orbital object.
 * @param {string} [event.severity] - 'Normal', 'Warning', 'High', 'Critical'.
 * @param {string} event.summary - Summary explanation of the event.
 */
async function recordMissionEvent(event) {
  if (!event || !event.eventType) return null;

  try {
    const newLog = await AuditLog.create({
      eventType: event.eventType,
      severity: event.severity || 'Normal',
      message: event.summary || event.message || '',
      source: event.objectName || event.source || 'System',
      metadata: event.metadata || {},
      timestamp: event.timestamp ? new Date(event.timestamp) : new Date()
    });
    return newLog;
  } catch (err) {
    console.error('Failed to write audit log to database', err);
    return null;
  }
}

/**
 * Returns all recorded audit logs.
 * @returns {Promise<Array>} Audit logs list.
 */
async function getAuditLogs() {
  try {
    const logs = await AuditLog.find()
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();

    return logs.map((log) => ({
      eventType: log.eventType,
      severity: log.severity,
      objectName: log.source,
      summary: log.message,
      timestamp: log.timestamp,
    }));
  } catch (err) {
    console.error('Failed to read audit logs from database', err);
    return [];
  }
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

  const originalPredictScientific = collisionPredictionService.predictScientificCollision;
  if (originalPredictScientific) {
    collisionPredictionService.predictScientificCollision = async function (prim, sec) {
      const result = await originalPredictScientific.apply(this, arguments);
      if (result && prim && sec) {
        const severityMap = { Low: 'Normal', Medium: 'Warning', High: 'High', Critical: 'Critical' };
        const severity = severityMap[result.riskLevel] || 'Normal';

        await recordMissionEvent({
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

        await recordMissionEvent({
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
