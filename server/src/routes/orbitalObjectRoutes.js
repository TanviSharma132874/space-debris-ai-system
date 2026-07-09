const express = require('express');
const {
  createOrbitalObject,
  getAllOrbitalObjects,
} = require('../controllers/orbitalObjectController');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const { buildOrbitalObjectFromTLE, parseTLE } = require('../services/tleImportService');
const { validateTLE } = require('../services/tleValidationService');
const OrbitalObject = require('../models/OrbitalObject');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { propagateOrbit } = require('../services/orbitPropagationService');

const router = express.Router();

router.post('/', authMiddleware, requireRole('Admin', 'Operator'), createOrbitalObject);
router.get('/', authMiddleware, getAllOrbitalObjects);

router.get('/:id/trajectory', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { durationMinutes = 60, intervalMinutes = 5 } = req.query;

    const orbitalObject = await OrbitalObject.findById(id).lean();
    if (!orbitalObject) {
      return errorResponse(res, 404, 'Orbital object not found');
    }

    const propagationResult = await propagateOrbit({
      orbitalObject,
      durationMinutes: parseInt(durationMinutes, 10),
      intervalMinutes: parseInt(intervalMinutes, 10),
    });

    return successResponse(res, 200, 'Orbit propagated successfully', propagationResult);
  } catch (error) {
    return errorResponse(res, 500, error.message || 'Failed to propagate orbit');
  }
});

router.post('/import-tle', authMiddleware, requireRole('Admin', 'Operator'), async (req, res) => {
  try {
    const { tleText } = req.body;
    if (!tleText) {
      return errorResponse(res, 400, 'TLE text is required');
    }

    const parsedSatellites = parseTLE(tleText);
    if (parsedSatellites.length === 0) {
      return errorResponse(res, 400, 'No valid TLE records found');
    }

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    const errors = [];
    const satellites = [];

    for (const sat of parsedSatellites) {
      const noradId = sat.noradId || sat.satelliteNumber;
      const validation = validateTLE(sat.tleLine1, sat.tleLine2);
      if (!validation.isValid) {
        skipped++;
        errors.push(`Satellite "${sat.satelliteName || sat.satelliteNumber}" validation failed: ${validation.errors.join(', ')}`);
        continue;
      }

      try {
        const payload = buildOrbitalObjectFromTLE({
          satellite: sat,
          validation,
          source: 'Manual Import',
        });

        const existing = await OrbitalObject.findOne({
          $or: [
            { noradId },
            { catalogNumber: noradId },
          ],
        });

        if (existing) {
          const updatePayload = { ...payload };
          delete updatePayload.catalogNumber;
          existing.set(updatePayload);
          const updatedObject = await existing.save();
          updated++;
          satellites.push(updatedObject);
          continue;
        }

        const orbitalObject = await OrbitalObject.create(payload);

        imported++;
        satellites.push(orbitalObject);
      } catch (dbErr) {
        skipped++;
        errors.push(`Failed to import satellite "${sat.satelliteName || noradId}": ${dbErr.message}`);
      }
    }

    return successResponse(res, 201, 'TLE import completed', {
      imported,
      updated,
      skipped,
      errors,
      satellites,
    });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to import TLE');
  }
});

const { syncGroup } = require('../services/celestrakSyncService');

router.post('/sync/:group', authMiddleware, requireRole('Admin', 'Operator'), async (req, res) => {
  try {
    const { group } = req.params;
    const supportedGroups = ['active', 'debris', 'stations', 'visual'];
    
    if (!supportedGroups.includes(group)) {
      return errorResponse(
        res,
        400,
        `Unsupported CelesTrak group: ${group}. Supported groups are: active, debris, stations`
      );
    }
    
    const result = await syncGroup(group);
    return successResponse(res, 200, `CelesTrak group "${group}" synchronized successfully`, result);
  } catch (error) {
    console.error('CelesTrak sync failed:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
    });

    const message =
      process.env.NODE_ENV === 'development' && error.message
        ? error.message
        : 'Failed to synchronize with CelesTrak';

    return errorResponse(res, 500, message);
  }
});

module.exports = router;
