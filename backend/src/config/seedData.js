const bcrypt = require('bcryptjs');

const initialFacilities = [
  {
    _id: '65f001122334455667788001',
    name: 'Bay Industrial Treatment Complex',
    code: 'FAC-001',
    location: 'San Francisco Bay Outfall Sector 4, CA',
    permitNumber: 'NPDES-CA-009412',
    dischargeLimitProfile: {
      phMin: 6.5,
      phMax: 8.5,
      turbidityMax: 50.0,
      bodMax: 30.0,
      codMax: 75.0,
      chemicalDosingMax: 200.0,
      flowRateMax: 850.0,
    },
    status: 'Active',
    contactEmail: 'bay-compliance@ecoflow-water.com',
    contactPhone: '+1-555-019-2834',
  },
  {
    _id: '65f001122334455667788002',
    name: 'Cascade Pulp & Chemical Effluent Station',
    code: 'FAC-002',
    location: 'Columbia River Industrial Corridor, OR',
    permitNumber: 'NPDES-OR-003881',
    dischargeLimitProfile: {
      phMin: 6.5,
      phMax: 8.5,
      turbidityMax: 45.0,
      bodMax: 25.0,
      codMax: 70.0,
      chemicalDosingMax: 180.0,
      flowRateMax: 920.0,
    },
    status: 'Active',
    contactEmail: 'cascade-ops@ecoflow-water.com',
    contactPhone: '+1-555-019-7721',
  },
];

const seedUsers = [
  {
    _id: '65f001122334455667788101',
    name: 'Marcus Vance',
    email: 'operator@ecoflow.internal',
    passwordHash: '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.qPHWvV8GZ3/KiqF0Yv5K72c3d0m31/m', // "password123"
    plainPassword: 'password123',
    role: 'operator',
    facilityCode: 'FAC-001',
    phone: '+1-555-019-2834',
    active: true,
  },
  {
    _id: '65f001122334455667788102',
    name: 'Elena Rostova',
    email: 'compliance@ecoflow.internal',
    passwordHash: '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.qPHWvV8GZ3/KiqF0Yv5K72c3d0m31/m', // "password123"
    plainPassword: 'password123',
    role: 'compliance_officer',
    facilityCode: 'FAC-001',
    phone: '+1-555-019-9943',
    active: true,
  },
  {
    _id: '65f001122334455667788103',
    name: 'Dr. Sarah Chen',
    email: 'admin@ecoflow.internal',
    passwordHash: '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.qPHWvV8GZ3/KiqF0Yv5K72c3d0m31/m', // "password123"
    plainPassword: 'password123',
    role: 'admin',
    facilityCode: 'FAC-001',
    phone: '+1-555-019-1100',
    active: true,
  },
];

const generateInitialMetrics = () => {
  const list = [];
  const now = Date.now();
  for (let i = 24; i >= 0; i--) {
    const timestamp = new Date(now - i * 60 * 1000); // 1 minute intervals
    const phBase = 7.1 + Math.sin(i / 3) * 0.35;
    const turbBase = 4.2 + (i % 4) * 0.8;
    const doseBase = 45 + Math.cos(i) * 5;
    const flowBase = 120 + Math.sin(i) * 12;

    list.push({
      _id: 'metric_' + (25 - i),
      facilityCode: 'FAC-001',
      timestamp,
      ph: parseFloat(phBase.toFixed(2)),
      turbidity: parseFloat(turbBase.toFixed(1)),
      chemicalDosing: parseFloat(doseBase.toFixed(1)),
      effluentFlow: parseFloat(flowBase.toFixed(1)),
      bod: 18.5,
      cod: 42.0,
      tss: 12.0,
      temperature: 21.8,
      dissolvedOxygen: 7.1,
      isOffline: false,
      aiRiskScore: 6.5,
      aiComplianceStatus: 'COMPLIANT',
      waterQualityIndex: 94.2,
      violations: [],
      remediationRecommendations: ['All primary environmental water parameters operating within certified regulatory bounds.'],
      source: 'SCADA_RTU',
    });
  }
  return list;
};

const initialAlerts = [
  {
    _id: 'alt_001',
    facilityCode: 'FAC-001',
    alertType: 'PH_CRITICAL_BREACH',
    severity: 'CRITICAL',
    parameter: 'pH Level',
    measuredValue: 9.3,
    regulatoryLimit: '6.5 - 8.5 pH',
    message: 'Effluent pH surge to 9.3 exceeded EPA alkaline upper threshold.',
    status: 'TRIGGERED',
    triggeredAt: new Date(Date.now() - 15 * 60 * 1000),
    twilioNotification: {
      attempted: true,
      sent: true,
      messageSid: 'SM_simulated_9823412',
      recipientPhone: '+1-555-019-9943',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      mode: 'MOCK_DISPATCH',
    },
  },
  {
    _id: 'alt_002',
    facilityCode: 'FAC-001',
    alertType: 'TURBIDITY_EXCEEDED',
    severity: 'HIGH',
    parameter: 'Turbidity',
    measuredValue: 54.2,
    regulatoryLimit: '<= 50.0 NTU',
    message: 'Turbidity peak of 54.2 NTU detected following secondary clarifier backwash.',
    status: 'ACKNOWLEDGED',
    triggeredAt: new Date(Date.now() - 45 * 60 * 1000),
    acknowledgedAt: new Date(Date.now() - 30 * 60 * 1000),
    acknowledgedBy: 'Marcus Vance (Operator)',
    twilioNotification: {
      attempted: true,
      sent: true,
      messageSid: 'SM_simulated_7718290',
      recipientPhone: '+1-555-019-2834',
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      mode: 'MOCK_DISPATCH',
    },
  },
];

const initialAuditLogs = [
  {
    _id: 'log_001',
    timestamp: new Date(Date.now() - 120 * 60 * 1000),
    action: 'SYSTEM_BOOTSTRAP',
    facilityCode: 'FAC-001',
    actor: {
      name: 'Dr. Sarah Chen',
      email: 'admin@ecoflow.internal',
      role: 'admin',
    },
    details: {
      message: 'EcoFlow AI telemetry engine initialized with NPDES-CA-009412 discharge limits.',
      version: '1.0.0',
    },
    ipAddress: '127.0.0.1',
  },
  {
    _id: 'log_002',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    action: 'ALERT_ACKNOWLEDGED',
    facilityCode: 'FAC-001',
    actor: {
      name: 'Marcus Vance',
      email: 'operator@ecoflow.internal',
      role: 'operator',
    },
    details: {
      alertId: 'alt_002',
      alertType: 'TURBIDITY_EXCEEDED',
      measuredValue: 54.2,
      note: 'Inspected coagulant line. Polymer feeder cycle increased.',
    },
    ipAddress: '192.168.1.42',
  },
];

module.exports = {
  initialFacilities,
  seedUsers,
  initialMetrics: generateInitialMetrics(),
  initialAlerts,
  initialAuditLogs,
};
