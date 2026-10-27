const express = require('express');
const router = express.Router();
const { getAuditLogs, createAuditEntry } = require('../controllers/auditController');

router.get('/', getAuditLogs);
router.post('/', createAuditEntry);

module.exports = router;
