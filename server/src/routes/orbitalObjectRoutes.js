const express = require('express');
const {
  createOrbitalObject,
  getAllOrbitalObjects,
} = require('../controllers/orbitalObjectController');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const { parseTLE } = require('../services/tleImportService');
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

    const propagationResult = propagateOrbit({
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
    let imported = 0;
    let skipped = 0;
    const errors = [];
    const satellites = [];

    for (const sat of parsedSatellites) {
      const validation = validateTLE(sat.tleLine1, sat.tleLine2);
      if (!validation.isValid) {
        skipped++;
        errors.push(`Satellite "${sat.satelliteName || sat.satelliteNumber}" validation failed: ${validation.errors.join(', ')}`);
        continue;
      }

      // Check if catalog number already exists
      const existing = await OrbitalObject.findOne({ catalogNumber: sat.satelliteNumber });
      if (existing) {
        skipped++;
        errors.push(`Satellite "${sat.satelliteName}" (${sat.satelliteNumber}) catalog number already exists.`);
        continue;
      }

      // Keplerian mechanics from TLE
      const line2 = sat.tleLine2.trim();
      const meanMotion = parseFloat(line2.substring(52, 63).trim());
      const inclination = parseFloat(line2.substring(8, 16).trim());
      const eccentricity = parseFloat('.' + line2.substring(26, 33).trim());

      let orbitType = 'LEO';
      let altitudeKm = 400;
      let velocityKmPerSec = 7.7;

      if (!isNaN(meanMotion)) {
        if (meanMotion >= 11.25) orbitType = 'LEO';
        else if (meanMotion > 1.05 && meanMotion < 11.25) orbitType = 'MEO';
        else if (meanMotion >= 0.95 && meanMotion <= 1.05) orbitType = 'GEO';
        else orbitType = 'HEO';

        try {
          const G_M = 398600.4418; // km^3/s^2
          const R_E = 6378.1; // km
          const n_rad_s = (meanMotion * 2 * Math.PI) / 86400;
          const a = Math.pow(G_M / (n_rad_s * n_rad_s), 1/3);
          altitudeKm = Math.round((a - R_E) * 100) / 100;
          velocityKmPerSec = Math.round(Math.sqrt(G_M / a) * 10000) / 10000;
        } catch (mathErr) {
          // Keep defaults
        }
      }

      const orbitalObject = await OrbitalObject.create({
        name: sat.satelliteName,
        catalogNumber: sat.satelliteNumber,
        objectType: 'Satellite',
        orbitType,
        altitudeKm,
        velocityKmPerSec,
        inclination,
        eccentricity,
        status: 'Active',
      });

      imported++;
      satellites.push(orbitalObject);
    }

    return successResponse(res, 201, 'TLE import completed', {
      imported,
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
    const supportedGroups = ['active', 'stations', 'visual'];
    
    if (!supportedGroups.includes(group)) {
      return errorResponse(
        res,
        400,
        `Unsupported CelesTrak group: ${group}. Supported groups are: active, stations, visual`
      );
    }
    
    const result = await syncGroup(group);
    return successResponse(res, 200, `CelesTrak group "${group}" synchronized successfully`, result);
  } catch (error) {
    return errorResponse(res, 500, error.message || 'Failed to synchronize with CelesTrak');
  }
});

module.exports = router;

