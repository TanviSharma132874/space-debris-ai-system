const mongoose = require('mongoose');

const riskAssessmentSchema = new mongoose.Schema(
  {
    collisionEvent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CollisionEvent',
      required: [true, 'Collision event is required'],
    },
    overallRiskScore: {
      type: Number,
      required: [true, 'Overall risk score is required'],
      min: [0, 'Overall risk score cannot be less than 0'],
      max: [100, 'Overall risk score cannot exceed 100'],
    },
    probabilityScore: {
      type: Number,
      required: [true, 'Probability score is required'],
      min: [0, 'Probability score cannot be less than 0'],
      max: [100, 'Probability score cannot exceed 100'],
    },
    severityScore: {
      type: Number,
      required: [true, 'Severity score is required'],
      min: [0, 'Severity score cannot be less than 0'],
      max: [100, 'Severity score cannot exceed 100'],
    },
    confidenceScore: {
      type: Number,
      required: [true, 'Confidence score is required'],
      min: [0, 'Confidence score cannot be less than 0'],
      max: [100, 'Confidence score cannot exceed 100'],
    },
    recommendedAction: {
      type: String,
      required: [true, 'Recommended action is required'],
      enum: {
        values: ['Monitor', 'Increase Tracking', 'Plan Maneuver', 'Immediate Action'],
        message:
          'Recommended action must be Monitor, Increase Tracking, Plan Maneuver, or Immediate Action',
      },
    },
    assessedBy: {
      type: String,
      required: [true, 'Assessment source is required'],
      enum: {
        values: ['System', 'AI', 'Operator'],
        message: 'Assessment source must be System, AI, or Operator',
      },
      default: 'System',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('RiskAssessment', riskAssessmentSchema);
