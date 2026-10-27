const mongoose = require('mongoose');

const ComplianceAlertSchema = new mongoose.Schema(
  {
    facilityCode: {
      type: String,
      required: true,
      default: 'FAC-001',
      index: true,
    },
    alertType: {
      type: String,
      required: true,
      enum: [
        'PH_CRITICAL_BREACH',
        'PH_ELEVATED_WARNING',
        'TURBIDITY_EXCEEDED',
        'BOD_SPIKE',
        'CHEMICAL_OVERDOSE',
        'SENSOR_OFFLINE',
        'FLOW_LIMIT_EXCEEDED',
      ],
      index: true,
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
      index: true,
    },
    parameter: {
      type: String,
      required: true,
    },
    measuredValue: {
      type: Number,
      required: true,
    },
    regulatoryLimit: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['TRIGGERED', 'ACKNOWLEDGED', 'RESOLVED'],
      default: 'TRIGGERED',
      index: true,
    },
    triggeredAt: {
      type: Date,
      default: Date.now,
    },
    acknowledgedAt: {
      type: Date,
    },
    acknowledgedBy: {
      type: String,
    },
    resolvedAt: {
      type: Date,
    },
    resolvedBy: {
      type: String,
    },
    resolutionNotes: {
      type: String,
    },
    twilioNotification: {
      attempted: { type: Boolean, default: false },
      sent: { type: Boolean, default: false },
      messageSid: { type: String },
      recipientPhone: { type: String },
      timestamp: { type: Date },
      error: { type: String },
      mode: { type: String, enum: ['LIVE_TWILIO', 'MOCK_DISPATCH'], default: 'MOCK_DISPATCH' },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ComplianceAlert', ComplianceAlertSchema);
