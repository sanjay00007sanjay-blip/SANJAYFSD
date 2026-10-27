const mongoose = require('mongoose');
const memoryStore = require('./store');
const { initialFacilities, seedUsers, initialMetrics, initialAlerts, initialAuditLogs } = require('./seedData');

let isConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecoflow';

  // Pre-populate memory store so it always has data ready
  memoryStore.initSeedData({
    facilities: initialFacilities,
    users: seedUsers,
    metrics: initialMetrics,
    alerts: initialAlerts,
    auditLogs: initialAuditLogs,
  });

  try {
    console.log(`Connecting to MongoDB at: ${uri.replace(/\/\/.*@/, '//<credentials>@')} ...`);
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500, // Quick timeout to prevent stalling if mongod is not running
    });

    isConnected = true;
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Seed database if empty
    await seedMongoDatabase();
  } catch (err) {
    isConnected = false;
    console.warn(`[EcoFlow DB Warning] MongoDB not available (${err.message}).`);
    console.log(`[EcoFlow DB Mode] Operating in Resilient In-Memory Mode. All APIs and Real-time WebSockets remain fully functional!`);
  }
};

const seedMongoDatabase = async () => {
  try {
    const Facility = require('../models/Facility');
    const User = require('../models/User');
    const SensorMetric = require('../models/SensorMetric');
    const ComplianceAlert = require('../models/ComplianceAlert');
    const AuditLog = require('../models/AuditLog');

    const facilityCount = await Facility.countDocuments();
    if (facilityCount === 0) {
      await Facility.insertMany(initialFacilities);
      console.log('MongoDB Seeded: Facilities');
    }

    const userCount = await User.countDocuments();
    if (userCount === 0) {
      for (const u of seedUsers) {
        const userDoc = new User({
          name: u.name,
          email: u.email,
          password: u.plainPassword,
          role: u.role,
          facilityCode: u.facilityCode,
          phone: u.phone,
        });
        await userDoc.save();
      }
      console.log('MongoDB Seeded: Users (operator, compliance officer, admin)');
    }

    const metricCount = await SensorMetric.countDocuments();
    if (metricCount === 0) {
      await SensorMetric.insertMany(initialMetrics);
      console.log('MongoDB Seeded: Initial sensor metrics');
    }

    const alertCount = await ComplianceAlert.countDocuments();
    if (alertCount === 0) {
      await ComplianceAlert.insertMany(initialAlerts);
      console.log('MongoDB Seeded: Initial alerts');
    }

    const auditCount = await AuditLog.countDocuments();
    if (auditCount === 0) {
      await AuditLog.insertMany(initialAuditLogs);
      console.log('MongoDB Seeded: Audit logs');
    }
  } catch (error) {
    console.error('Error seeding MongoDB:', error.message);
  }
};

module.exports = {
  connectDB,
  isMongoConnected: () => isConnected,
};
