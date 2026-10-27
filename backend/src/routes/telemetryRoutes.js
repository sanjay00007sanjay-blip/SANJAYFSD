const express = require('express');
const router = express.Router();
const {
  ingestTelemetry,
  getRecentHistory,
  getLatestMetric,
  evaluateParametersPreview,
} = require('../controllers/telemetryController');

router.post('/ingest', ingestTelemetry);
router.get('/history', getRecentHistory);
router.get('/latest', getLatestMetric);
router.post('/evaluate-preview', evaluateParametersPreview);

module.exports = router;
