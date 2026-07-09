const OrbitalObject = require('../models/OrbitalObject');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { validateTLE } = require('../services/tleValidationService');
const { calculateSatelliteHealth } = require('../services/satelliteHealthService');
const { detectOrbitalEvents } = require('../services/orbitalEventService');
const { buildDigitalTwin } = require('../services/digitalTwinService');

const createOrbitalObject = async (req, res) => {
  try {
    const { name, catalogNumber, objectType, orbitType, tleLine1, tleLine2 } = req.body;

    if (!name || !catalogNumber || !objectType || !orbitType) {
      return errorResponse(
        res,
        400,
        'Name, catalog number, object type, and orbit type are required'
      );
    }

    const existingObject = await OrbitalObject.findOne({ catalogNumber });

    if (existingObject) {
      return errorResponse(res, 409, 'Catalog number already exists');
    }

    let tleValidation = null;
    if (tleLine1 || tleLine2) {
      tleValidation = validateTLE(tleLine1, tleLine2);
    }

    const orbitalObject = await OrbitalObject.create(req.body);

    return successResponse(
      res,
      201,
      'Orbital object created successfully',
      {
        ...orbitalObject.toObject(),
        tleValidation,
      }
    );
  } catch (error) {
    return errorResponse(res, 500, 'Failed to create orbital object');
  }
};

const getAllOrbitalObjects = async (req, res) => {
  try {
    const { search, objectType, orbitType, status } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { catalogNumber: { $regex: search, $options: 'i' } },
      ];
    }

    if (objectType && objectType !== 'All') {
      query.objectType = objectType;
    }

    if (orbitType && orbitType !== 'All') {
      query.orbitType = orbitType;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    const orbitalObjects = await OrbitalObject.find(query)
      .sort({ createdAt: -1 })
      .lean();

    const objectsWithDigitalTwin = await Promise.all(
      orbitalObjects.map(async (obj) => {
        const health = calculateSatelliteHealth(obj);
        const orbitalEvents = detectOrbitalEvents(obj);
        const digitalTwin = await buildDigitalTwin(obj);
        return {
          ...obj,
          health,
          orbitalEvents,
          digitalTwin
        };
      })
    );

    return successResponse(
      res,
      200,
      'Orbital objects retrieved successfully',
      objectsWithDigitalTwin
    );
  } catch (error) {
    return errorResponse(res, 500, 'Failed to retrieve orbital objects');
  }
};

module.exports = {
  createOrbitalObject,
  getAllOrbitalObjects,
};
