const mongoose = require('mongoose');

const SensorMetricSchema = new mongoose.Schema(
  {
    facilityCode: {
      type: String,
      required: true,
      default: 'FAC-001',
      index: true,
    },
    facilityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Facility',
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    ph: {
      type: Number,
      required: true,
    },
    turbidity: {
      type: Number,
      required: true, // NTU
    },
    chemicalDosing: {
      type: Number,
      required: true, // mg/L
    },
    effluentFlow: {
      type: Number,
      required: true, // L/s
    },
    bod: {
      type: Number,
      default: 20.0, // mg/L
    },
    cod: {
      type: Number,
      default: 45.0, // mg/L
    },
    tss: {
      type: Number,
      default: 15.0, // mg/L
    },
    temperature: {
      type: Number,
      default: 22.0, // °C
    },
    dissolvedOxygen: {
      type: Number,
      default: 6.8, // mg/L
    },
    isOffline: {
      type: Boolean,
      default: false,
    },
    aiRiskScore: {
      type: Number,
      default: 0.0,
    },
    aiComplianceStatus: {
      type: String,
      enum: ['COMPLIANT', 'WARNING', 'CRITICAL', 'OFFLINE'],
      default: 'COMPLIANT',
      index: true,
    },
    waterQualityIndex: {
      type: Number,
      default: 100.0,
    },
    violations: [
      {
        parameter: String,
        measuredValue: Number,
        regulatoryLimit: String,
        severity: String,
        description: String,
      },
    ],
    remediationRecommendations: [String],
    source: {
      type: String,
      enum: ['SIMULATOR_DJ_CONSOLE', 'SCADA_RTU', 'MANUAL_INSPECTION'],
      default: 'SIMULATOR_DJ_CONSOLE',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SensorMetric', SensorMetricSchema);
