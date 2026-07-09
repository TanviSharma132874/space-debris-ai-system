const express = require('express');
const {
  predictCollisionRisk,
  simulateCollisionManeuver,
  getPredictionTimeline,
  getAnalyticsSummary,
} = require('../controllers/collisionPredictionController');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const { generatePredictionReport } = require('../services/reportService');
const {
  saveScenario,
  deleteScenario,
  listScenarios,
} = require('../services/scenarioService');
const CollisionEvent = require('../models/CollisionEvent');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { getAuditLogs, recordMissionEvent } = require('../services/missionAuditService');

const router = express.Router();

router.post('/predict', authMiddleware, requireRole('Admin', 'Analyst'), predictCollisionRisk);
router.post('/simulate', authMiddleware, requireRole('Admin', 'Analyst'), simulateCollisionManeuver);
router.get('/timeline', authMiddleware, requireRole('Admin', 'Analyst'), getPredictionTimeline);
router.get('/analytics-summary', authMiddleware, requireRole('Admin', 'Analyst'), getAnalyticsSummary);
router.get('/audit-logs', authMiddleware, (req, res) => {
  return successResponse(res, 200, 'Audit logs retrieved successfully', getAuditLogs());
});
router.post('/audit-logs', authMiddleware, (req, res) => {
  recordMissionEvent(req.body);
  return successResponse(res, 201, 'Audit log recorded successfully');
});

router.get('/scenarios', authMiddleware, async (req, res) => {
  try {
    const scenarios = await listScenarios();
    return successResponse(res, 200, 'Scenarios retrieved successfully', scenarios);
  } catch (error) {
    return errorResponse(res, 500, 'Failed to retrieve scenarios');
  }
});

router.post('/scenarios', authMiddleware, requireRole('Admin', 'Analyst'), async (req, res) => {
  try {
    const scenario = await saveScenario(req.body);
    return successResponse(res, 201, 'Scenario saved successfully', scenario);
  } catch (error) {
    return errorResponse(res, 400, error.message);
  }
});

router.delete('/scenarios/:id', authMiddleware, requireRole('Admin', 'Analyst'), async (req, res) => {
  try {
    const { id } = req.params;
    await deleteScenario(id);
    return successResponse(res, 200, 'Scenario deleted successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Failed to delete scenario');
  }
});

router.get('/report/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const collisionEvent = await CollisionEvent.findById(id)
      .populate('primaryObject')
      .populate('secondaryObject')
      .lean();

    if (!collisionEvent) {
      return errorResponse(res, 404, 'Collision event not found');
    }

    const report = generatePredictionReport(collisionEvent);
    return successResponse(res, 200, 'Report generated successfully', report);
  } catch (error) {
    return errorResponse(res, 500, 'Failed to generate report');
  }
});

module.exports = router;
