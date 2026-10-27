const express = require('express');
const router = express.Router();
const { getAlerts, acknowledgeAlert, resolveAlert, getAlertStats } = require('../controllers/alertController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', getAlerts);
router.get('/stats', getAlertStats);
router.patch('/:id/acknowledge', acknowledgeAlert); // Optional auth or open for operator quick action
router.patch('/:id/resolve', resolveAlert); // Compliance resolution

module.exports = router;
