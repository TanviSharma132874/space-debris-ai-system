const mongoose = require('mongoose');

const orbitalObjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [150, 'Name cannot exceed 150 characters'],
    },
    catalogNumber: {
      type: String,
      required: [true, 'Catalog number is required'],
      unique: true,
      trim: true,
      maxlength: [50, 'Catalog number cannot exceed 50 characters'],
    },
    noradId: {
      type: String,
      trim: true,
      maxlength: [20, 'NORAD ID cannot exceed 20 characters'],
    },
    internationalDesignator: {
      type: String,
      trim: true,
      maxlength: [30, 'International designator cannot exceed 30 characters'],
    },
    objectType: {
      type: String,
      required: [true, 'Object type is required'],
      enum: {
        values: ['Satellite', 'Debris', 'RocketBody', 'Unknown'],
        message: 'Object type must be Satellite, Debris, RocketBody, or Unknown',
      },
      default: 'Unknown',
    },
    orbitType: {
      type: String,
      required: [true, 'Orbit type is required'],
      enum: {
        values: ['LEO', 'MEO', 'GEO', 'HEO'],
        message: 'Orbit type must be LEO, MEO, GEO, or HEO',
      },
    },
    country: {
      type: String,
      trim: true,
      maxlength: [100, 'Country cannot exceed 100 characters'],
      default: 'Unknown',
    },
    operator: {
      type: String,
      trim: true,
      maxlength: [150, 'Operator cannot exceed 150 characters'],
      default: 'Unknown',
    },
    launchDate: {
      type: Date,
    },
    altitudeKm: {
      type: Number,
      required: [true, 'Altitude is required'],
      min: [0, 'Altitude cannot be negative'],
    },
    velocityKmPerSec: {
      type: Number,
      required: [true, 'Velocity is required'],
      min: [0, 'Velocity cannot be negative'],
    },
    inclination: {
      type: Number,
      required: [true, 'Inclination is required'],
      min: [0, 'Inclination cannot be less than 0 degrees'],
      max: [180, 'Inclination cannot exceed 180 degrees'],
    },
    eccentricity: {
      type: Number,
      required: [true, 'Eccentricity is required'],
      min: [0, 'Eccentricity cannot be negative'],
      max: [1, 'Eccentricity cannot exceed 1'],
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: ['Active', 'Inactive', 'Decayed'],
        message: 'Status must be Active, Inactive, or Decayed',
      },
      default: 'Active',
    },
    health: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    tle: {
      line1: {
        type: String,
        trim: true,
      },
      line2: {
        type: String,
        trim: true,
      },
      epoch: {
        type: String,
        trim: true,
      },
      source: {
        type: String,
        trim: true,
      },
      lastUpdated: {
        type: Date,
      },
    },
    orbitalElements: {
      eccentricity: {
        type: Number,
        min: [0, 'Orbital element eccentricity cannot be negative'],
        max: [1, 'Orbital element eccentricity cannot exceed 1'],
      },
      raan: {
        type: Number,
        min: [0, 'RAAN cannot be less than 0 degrees'],
        max: [360, 'RAAN cannot exceed 360 degrees'],
      },
      argumentOfPerigee: {
        type: Number,
        min: [0, 'Argument of perigee cannot be less than 0 degrees'],
        max: [360, 'Argument of perigee cannot exceed 360 degrees'],
      },
      meanAnomaly: {
        type: Number,
        min: [0, 'Mean anomaly cannot be less than 0 degrees'],
        max: [360, 'Mean anomaly cannot exceed 360 degrees'],
      },
      meanMotion: {
        type: Number,
        min: [0, 'Mean motion cannot be negative'],
      },
    },
    tracking: {
      lastPropagated: {
        type: Date,
      },
      dataSource: {
        type: String,
        trim: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

orbitalObjectSchema.index(
  { noradId: 1 },
  {
    unique: true,
    sparse: true,
  }
);

module.exports = mongoose.model('OrbitalObject', orbitalObjectSchema);
