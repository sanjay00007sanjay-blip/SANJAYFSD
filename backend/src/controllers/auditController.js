const AuditLog = require('../models/AuditLog');
const memoryStore = require('../config/store');
const { isMongoConnected } = require('../config/db');

// @route GET /api/audit-logs
exports.getAuditLogs = async (req, res) => {
  try {
    const { limit = 50, facilityCode } = req.query;
    const filter = {};
    if (facilityCode) filter.facilityCode = facilityCode;

    let logs = [];
    if (isMongoConnected()) {
      try {
        logs = await AuditLog.find(filter).sort({ timestamp: -1 }).limit(parseInt(limit, 10));
      } catch (e) {
        logs = memoryStore.getAuditLogs(parseInt(limit, 10));
      }
    } else {
      logs = memoryStore.getAuditLogs(parseInt(limit, 10));
    }

    return res.status(200).json({ success: true, count: logs.length, logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /api/audit-logs
exports.createAuditEntry = async (req, res) => {
  try {
    const { action, details, facilityCode = 'FAC-001' } = req.body;
    const actor = req.user
      ? { userId: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role }
      : { name: 'Anonymous Client', role: 'operator' };

    const entry = {
      action,
      facilityCode,
      actor,
      details,
      timestamp: new Date(),
      ipAddress: req.ip || '127.0.0.1',
    };

    let saved;
    if (isMongoConnected()) {
      try {
        saved = await AuditLog.create(entry);
      } catch (e) {
        saved = memoryStore.addAuditLog(entry);
      }
    } else {
      saved = memoryStore.addAuditLog(entry);
    }

    return res.status(201).json({ success: true, auditLog: saved });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
