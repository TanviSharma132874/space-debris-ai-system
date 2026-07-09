const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      required: true,
      index: true,
    },
    severity: {
      type: String,
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
    },
    source: {
      type: String,
      required: true,
      default: 'System',
    },
    metadata: {
      type: Object,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
