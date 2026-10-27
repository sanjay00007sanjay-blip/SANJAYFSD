const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { isMongoConnected } = require('../config/db');
const memoryStore = require('../config/store');
const { JWT_SECRET } = require('../middleware/authMiddleware');

const signToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// @route POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    let user = null;
    let isMatch = false;

    if (isMongoConnected()) {
      user = await User.findOne({ email: email.toLowerCase() });
      if (user) {
        isMatch = await user.matchPassword(password);
      }
    }

    // Fallback to memory store if Mongo is not connected or user was not found
    if (!user) {
      const memUser = memoryStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (memUser) {
        // Compare password with plain or bcrypt
        if (memUser.plainPassword && memUser.plainPassword === password) {
          isMatch = true;
          user = memUser;
        } else if (memUser.passwordHash) {
          isMatch = await bcrypt.compare(password, memUser.passwordHash);
          if (isMatch) user = memUser;
        }
      }
    }

    if (!user || !isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Check email and password.' });
    }

    const token = signToken(user);

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        facilityCode: user.facilityCode,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, role = 'operator', facilityCode = 'FAC-001', phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
    }

    // Check if user exists
    let existing = null;
    if (isMongoConnected()) {
      existing = await User.findOne({ email: email.toLowerCase() });
    } else {
      existing = memoryStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    }

    if (existing) {
      return res.status(400).json({ success: false, message: 'A user with this email address already exists.' });
    }

    let newUser;
    if (isMongoConnected()) {
      newUser = await User.create({
        name,
        email: email.toLowerCase(),
        password,
        role,
        facilityCode,
        phone: phone || '+15550192834',
      });
    } else {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      newUser = {
        _id: 'user_' + Date.now(),
        name,
        email: email.toLowerCase(),
        passwordHash: hash,
        plainPassword: password,
        role,
        facilityCode,
        phone: phone || '+15550192834',
        active: true,
      };
      memoryStore.users.push(newUser);
    }

    const token = signToken(newUser);

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        facilityCode: newUser.facilityCode,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/auth/me
exports.getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
};

// @route GET /api/auth/users (Admin only)
exports.getAllUsers = async (req, res) => {
  try {
    let users = [];
    if (isMongoConnected()) {
      users = await User.find().select('-password');
    } else {
      users = memoryStore.users.map(({ passwordHash, plainPassword, ...rest }) => rest);
    }
    return res.status(200).json({ success: true, count: users.length, users });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/auth/demo-credentials
exports.getDemoCredentials = (req, res) => {
  res.json({
    operator: { email: 'operator@ecoflow.internal', password: 'password123', role: 'Plant Operator' },
    compliance: { email: 'compliance@ecoflow.internal', password: 'password123', role: 'Environmental Compliance Officer' },
    admin: { email: 'admin@ecoflow.internal', password: 'password123', role: 'System Administrator' },
  });
};
