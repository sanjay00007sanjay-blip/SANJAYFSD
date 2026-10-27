const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isMongoConnected } = require('../config/db');
const memoryStore = require('../config/store');

const JWT_SECRET = process.env.JWT_SECRET || 'ecoflow-super-secret-production-key-2026';

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this resource. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    let user = null;
    if (isMongoConnected()) {
      user = await User.findById(decoded.id).select('-password');
    }

    if (!user) {
      // Find in memory store
      user = memoryStore.users.find((u) => u._id === decoded.id || u.email === decoded.email);
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'User belonging to this token no longer exists.' });
    }

    req.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      facilityCode: user.facilityCode,
      phone: user.phone,
    };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: User role '${req.user ? req.user.role : 'anonymous'}' is not authorized to access this endpoint. Required: [${roles.join(', ')}]`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize, JWT_SECRET };
