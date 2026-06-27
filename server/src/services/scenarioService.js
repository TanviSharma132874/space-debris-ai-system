const mongoose = require('mongoose');

// Define the Prediction Scenario schema
const predictionScenarioSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Scenario name is required'],
      trim: true,
      maxlength: [150, 'Scenario name cannot exceed 150 characters'],
    },
    primaryObject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OrbitalObject',
      required: [true, 'Primary object is required'],
    },
    secondaryObject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OrbitalObject',
      required: [true, 'Secondary object is required'],
    },
    predictionResult: {
      altitudeDifference: { type: Number, required: true },
      relativeVelocity: { type: Number, required: true },
      riskLevel: { type: String, required: true },
    },
    recommendation: {
      type: String,
      required: [true, 'Recommendation is required'],
    },
    missionImpact: {
      missionCategory: { type: String, required: true },
      impactLevel: { type: String, required: true },
      impactDescription: { type: String, required: true },
    },
    confidence: {
      confidenceScore: { type: Number, required: true },
      confidenceLevel: { type: String, required: true },
    },
    validation: {
      isValid: { type: Boolean, required: true },
      qualityLevel: { type: String, required: true },
      warnings: [{ type: String }],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Register model
const PredictionScenario =
  mongoose.models.PredictionScenario ||
  mongoose.model('PredictionScenario', predictionScenarioSchema);

/**
 * Saves a new prediction scenario.
 *
 * @param {Object} data - Scenario data.
 * @returns {Promise<Object>} Created scenario.
 */
const saveScenario = async (data) => {
  return await PredictionScenario.create(data);
};

/**
 * Renames an existing scenario.
 *
 * @param {string} id - Scenario ID.
 * @param {string} name - New name.
 * @returns {Promise<Object>} Updated scenario.
 */
const renameScenario = async (id, name) => {
  return await PredictionScenario.findByIdAndUpdate(
    id,
    { name },
    { new: true }
  );
};

/**
 * Deletes a scenario.
 *
 * @param {string} id - Scenario ID.
 * @returns {Promise<Object>} Deleted scenario.
 */
const deleteScenario = async (id) => {
  return await PredictionScenario.findByIdAndDelete(id);
};

/**
 * Lists all saved scenarios.
 *
 * @returns {Promise<Array>} List of scenarios.
 */
const listScenarios = async () => {
  return await PredictionScenario.find()
    .populate('primaryObject')
    .populate('secondaryObject')
    .sort({ createdAt: -1 })
    .lean();
};

module.exports = {
  saveScenario,
  renameScenario,
  deleteScenario,
  listScenarios,
};
