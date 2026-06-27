const mongoose = require('mongoose');
const OrbitalObject = require('../models/OrbitalObject');
const CollisionEvent = require('../models/CollisionEvent');

/**
 * Generates an operational health summary of the system.
 *
 * @returns {Promise<Object>} The system health details.
 */
const generateSystemHealth = async () => {
  const readyState = mongoose.connection.readyState;
  const databaseStatus = readyState === 1 ? 'Healthy' : 'Unhealthy';
  const apiStatus = 'Healthy';

  try {
    const totalOrbitalObjects = await OrbitalObject.countDocuments();
    const totalPredictions = await CollisionEvent.countDocuments();
    const totalCriticalEvents = await CollisionEvent.countDocuments({ riskLevel: 'Critical' });

    const lastEvent = await CollisionEvent.findOne()
      .sort({ createdAt: -1 })
      .select('createdAt')
      .lean();
    const lastPredictionTime = lastEvent ? lastEvent.createdAt : null;

    return {
      databaseStatus,
      totalOrbitalObjects,
      totalPredictions,
      totalCriticalEvents,
      apiStatus,
      lastPredictionTime,
    };
  } catch (error) {
    return {
      databaseStatus: 'Error',
      totalOrbitalObjects: 0,
      totalPredictions: 0,
      totalCriticalEvents: 0,
      apiStatus: 'Degraded',
      lastPredictionTime: null,
      error: error.message,
    };
  }
};

module.exports = {
  generateSystemHealth,
};
