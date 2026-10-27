const mongoose = require('mongoose');

const FacilitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    location: {
      type: String,
      default: 'Industrial Zone A, Effluent Sector 4',
    },
    permitNumber: {
      type: String,
      required: true,
      trim: true,
    },
    dischargeLimitProfile: {
      phMin: { type: Number, default: 6.5 },
      phMax: { type: Number, default: 8.5 },
      turbidityMax: { type: Number, default: 50.0 }, // NTU
      bodMax: { type: Number, default: 30.0 }, // mg/L
      codMax: { type: Number, default: 75.0 }, // mg/L
      chemicalDosingMax: { type: Number, default: 200.0 }, // mg/L
      flowRateMax: { type: Number, default: 850.0 }, // L/s
    },
    status: {
      type: String,
      enum: ['Active', 'Maintenance', 'Decommissioned'],
      default: 'Active',
    },
    contactEmail: {
      type: String,
      default: 'compliance@ecoflow-water.com',
    },
    contactPhone: {
      type: String,
      default: '+15550192834',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Facility', FacilitySchema);
