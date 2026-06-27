const mongoose = require('mongoose');

const collisionEventSchema = new mongoose.Schema(
  {
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
    predictedTime: {
      type: Date,
      required: [true, 'Predicted time is required'],
    },
    minimumDistanceKm: {
      type: Number,
      required: [true, 'Minimum distance is required'],
      min: [0, 'Minimum distance cannot be negative'],
    },
    relativeVelocityKmPerSec: {
      type: Number,
      required: [true, 'Relative velocity is required'],
      min: [0, 'Relative velocity cannot be negative'],
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
    avoidanceRecommended: {
      type: Boolean,
      required: [true, 'Avoidance recommendation status is required'],
      default: false,
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: ['Pending', 'Monitoring', 'Avoided', 'CollisionOccurred', 'Archived'],
        message:
          'Status must be Pending, Monitoring, Avoided, CollisionOccurred, or Archived',
      },
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('CollisionEvent', collisionEventSchema);
