const ComplianceAlert = require('../models/ComplianceAlert');
const AuditLog = require('../models/AuditLog');
const memoryStore = require('../config/store');
const { isMongoConnected } = require('../config/db');
const { sendComplianceAlertSMS } = require('./notificationService');

// Throttle map to avoid alert floods every 2 seconds during active streaming
// key: `${facilityCode}_${alertType}`, value: timestamp
const lastAlertTriggerTime = new Map();
const THROTTLE_WINDOW_MS = 60 * 1000; // 1 minute throttle for identical alerts

async function checkAndTriggerComplianceAlerts(metric, aiEvaluation, io) {
  const triggeredAlerts = [];

  if (!aiEvaluation || !aiEvaluation.violations || aiEvaluation.violations.length === 0) {
    return triggeredAlerts;
  }

  const facilityCode = metric.facilityCode || 'FAC-001';

  for (const violation of aiEvaluation.violations) {
    // Determine alert type
    let alertType = 'PH_CRITICAL_BREACH';
    if (violation.parameter.includes('pH')) {
      alertType = violation.severity === 'CRITICAL' ? 'PH_CRITICAL_BREACH' : 'PH_ELEVATED_WARNING';
    } else if (violation.parameter.includes('Turbidity')) {
      alertType = 'TURBIDITY_EXCEEDED';
    } else if (violation.parameter.includes('Chemical')) {
      alertType = 'CHEMICAL_OVERDOSE';
    } else if (violation.parameter.includes('BOD') || violation.parameter.includes('Oxygen Demand')) {
      alertType = 'BOD_SPIKE';
    } else if (violation.parameter.includes('Connection') || violation.parameter.includes('Telemetry')) {
      alertType = 'SENSOR_OFFLINE';
    }

    // Only generate alerts for HIGH and CRITICAL violations or SENSOR_OFFLINE
    if (violation.severity !== 'CRITICAL' && violation.severity !== 'HIGH') {
      continue;
    }

    const throttleKey = `${facilityCode}_${alertType}`;
    const lastTime = lastAlertTriggerTime.get(throttleKey) || 0;
    const now = Date.now();

    if (now - lastTime < THROTTLE_WINDOW_MS) {
      // Throttled: Already triggered recently
      continue;
    }
    lastAlertTriggerTime.set(throttleKey, now);

    // Send SMS notification (or mock fallback) for CRITICAL breaches
    let twilioResult = { attempted: false, sent: false };
    if (violation.severity === 'CRITICAL') {
      twilioResult = await sendComplianceAlertSMS({
        alertType,
        parameter: violation.parameter,
        measuredValue: violation.measured_value,
        regulatoryLimit: violation.regulatory_limit,
        facilityCode,
      });
    }

    const alertData = {
      facilityCode,
      alertType,
      severity: violation.severity,
      parameter: violation.parameter,
      measuredValue: violation.measured_value,
      regulatoryLimit: violation.regulatory_limit,
      message: violation.description,
      status: 'TRIGGERED',
      triggeredAt: new Date(),
      twilioNotification: twilioResult,
    };

    let savedAlert = null;
    if (isMongoConnected()) {
      try {
        savedAlert = await ComplianceAlert.create(alertData);
      } catch (err) {
        console.error('Error saving alert in MongoDB:', err.message);
        savedAlert = memoryStore.addAlert(alertData);
      }
    } else {
      savedAlert = memoryStore.addAlert(alertData);
    }

    // Create Audit Log
    const auditData = {
      action: 'COMPLIANCE_ALERT_TRIGGERED',
      facilityCode,
      actor: {
        name: 'EcoFlow AI Telemetry Monitor',
        email: 'system@ecoflow.internal',
        role: 'system',
      },
      details: {
        alertId: savedAlert._id,
        alertType,
        parameter: violation.parameter,
        measuredValue: violation.measured_value,
        severity: violation.severity,
        smsDispatched: twilioResult.sent,
        smsSid: twilioResult.messageSid,
      },
      ipAddress: '127.0.0.1',
    };

    if (isMongoConnected()) {
      try {
        await AuditLog.create(auditData);
      } catch (e) {
        memoryStore.addAuditLog(auditData);
      }
    } else {
      memoryStore.addAuditLog(auditData);
    }

    triggeredAlerts.push(savedAlert);

    // Broadcast new alert in real-time to active operator dashboards via Socket.io
    if (io) {
      io.emit('compliance:alert_triggered', savedAlert);
    }
  }

  return triggeredAlerts;
}

module.exports = {
  checkAndTriggerComplianceAlerts,
};
