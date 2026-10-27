const express = require('express');
const router = express.Router();
const { login, register, getMe, getAllUsers, getDemoCredentials } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/login', login);
router.post('/register', register);
router.get('/me', protect, getMe);
router.get('/users', protect, authorize('admin'), getAllUsers);
router.get('/demo-credentials', getDemoCredentials);

module.exports = router;
