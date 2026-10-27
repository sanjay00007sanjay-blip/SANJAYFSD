const express = require('express');
const router = express.Router();
const { generateComplianceReport } = require('../controllers/reportController');

router.get('/compliance', generateComplianceReport);

module.exports = router;
