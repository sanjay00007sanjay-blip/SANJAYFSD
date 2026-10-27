const ComplianceAlert = require('../models/ComplianceAlert');
const AuditLog = require('../models/AuditLog');
const memoryStore = require('../config/store');
const { isMongoConnected } = require('../config/db');

// @route GET /api/alerts
exports.getAlerts = async (req, res) => {
  try {
    const { status, facilityCode, limit = 50 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (facilityCode) filter.facilityCode = facilityCode;

    let alerts = [];
    if (isMongoConnected()) {
      try {
        alerts = await ComplianceAlert.find(filter).sort({ triggeredAt: -1 }).limit(parseInt(limit, 10));
      } catch (e) {
        alerts = memoryStore.getAlerts(filter);
      }
    } else {
      alerts = memoryStore.getAlerts(filter);
    }

    return res.status(200).json({
      success: true,
      count: alerts.length,
      alerts,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route PATCH /api/alerts/:id/acknowledge
exports.acknowledgeAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const actorName = req.user ? req.user.name : req.body.actorName || 'Operator';
    const actorEmail = req.user ? req.user.email : 'operator@ecoflow.internal';

    const updates = {
      status: 'ACKNOWLEDGED',
      acknowledgedAt: new Date(),
      acknowledgedBy: actorName,
    };

    let alert;
    if (isMongoConnected()) {
      try {
        alert = await ComplianceAlert.findByIdAndUpdate(id, updates, { new: true });
      } catch (e) {}
    }
    if (!alert) {
      alert = memoryStore.updateAlert(id, updates);
    }

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found.' });
    }

    // Audit log
    const audit = {
      action: 'ALERT_ACKNOWLEDGED',
      facilityCode: alert.facilityCode || 'FAC-001',
      actor: { name: actorName, email: actorEmail, role: req.user ? req.user.role : 'operator' },
      details: { alertId: id, parameter: alert.parameter, measuredValue: alert.measuredValue },
    };
    memoryStore.addAuditLog(audit);
    if (isMongoConnected()) {
      try {
        await AuditLog.create(audit);
      } catch (e) {}
    }

    const io = req.app.get('io');
    if (io) io.emit('alert:updated', alert);

    return res.status(200).json({ success: true, alert });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route PATCH /api/alerts/:id/resolve
exports.resolveAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolutionNotes } = req.body;
    const actorName = req.user ? req.user.name : req.body.actorName || 'Compliance Officer';
    const actorEmail = req.user ? req.user.email : 'compliance@ecoflow.internal';

    const updates = {
      status: 'RESOLVED',
      resolvedAt: new Date(),
      resolvedBy: actorName,
      resolutionNotes: resolutionNotes || 'Remediation completed; discharge returned to certified regulatory bounds.',
    };

    let alert;
    if (isMongoConnected()) {
      try {
        alert = await ComplianceAlert.findByIdAndUpdate(id, updates, { new: true });
      } catch (e) {}
    }
    if (!alert) {
      alert = memoryStore.updateAlert(id, updates);
    }

    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found.' });
    }

    // Audit log
    const audit = {
      action: 'ALERT_RESOLVED',
      facilityCode: alert.facilityCode || 'FAC-001',
      actor: { name: actorName, email: actorEmail, role: req.user ? req.user.role : 'compliance_officer' },
      details: { alertId: id, resolutionNotes: updates.resolutionNotes },
    };
    memoryStore.addAuditLog(audit);
    if (isMongoConnected()) {
      try {
        await AuditLog.create(audit);
      } catch (e) {}
    }

    const io = req.app.get('io');
    if (io) io.emit('alert:updated', alert);

    return res.status(200).json({ success: true, alert });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/alerts/stats
exports.getAlertStats = async (req, res) => {
  try {
    let alerts = [];
    if (isMongoConnected()) {
      try {
        alerts = await ComplianceAlert.find();
      } catch (e) {
        alerts = memoryStore.alerts;
      }
    } else {
      alerts = memoryStore.alerts;
    }

    const stats = {
      total: alerts.length,
      triggered: alerts.filter((a) => a.status === 'TRIGGERED').length,
      acknowledged: alerts.filter((a) => a.status === 'ACKNOWLEDGED').length,
      resolved: alerts.filter((a) => a.status === 'RESOLVED').length,
      critical: alerts.filter((a) => a.severity === 'CRITICAL').length,
      high: alerts.filter((a) => a.severity === 'HIGH').length,
      smsDispatched: alerts.filter((a) => a.twilioNotification && a.twilioNotification.sent).length,
    };

    return res.status(200).json({ success: true, stats });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
