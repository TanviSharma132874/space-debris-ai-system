const mongoose = require('mongoose');

const riskAssessmentSchema = new mongoose.Schema(
  {
    collisionEvent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CollisionEvent',
      required: [true, 'Collision event is required'],
    },
    riskScore: {
      type: Number,
      required: [true, 'Risk score is required'],
      min: [0, 'Risk score cannot be less than 0'],
      max: [100, 'Risk score cannot exceed 100'],
    },
    collisionProbability: {
      type: Number,
      required: [true, 'Collision probability is required'],
      min: [0, 'Collision probability cannot be less than 0'],
      max: [1, 'Collision probability cannot exceed 1'],
    },
    riskLevel: {
      type: String,
      required: [true, 'Risk level is required'],
      enum: {
        values: ['Low', 'Medium', 'High', 'Critical'],
        message: 'Risk level must be Low, Medium, High, or Critical',
      },
    },
    aiConfidence: {
      type: Number,
      min: [0, 'AI confidence cannot be less than 0'],
      max: [1, 'AI confidence cannot exceed 1'],
    },
    recommendation: {
      type: String,
      required: [true, 'Recommendation is required'],
      trim: true,
    },
    mainRiskFactors: {
      type: [String],
      default: undefined,
    },
    assessedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('RiskAssessment', riskAssessmentSchema);
