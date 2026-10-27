const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    facilityCode: {
      type: String,
      default: 'FAC-001',
      index: true,
    },
    actor: {
      userId: { type: String },
      name: { type: String, required: true },
      email: { type: String },
      role: {
        type: String,
        enum: ['operator', 'compliance_officer', 'admin', 'system'],
        default: 'operator',
      },
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
    userAgent: {
      type: String,
      default: 'EcoFlow Web Client',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AuditLog', AuditLogSchema);
