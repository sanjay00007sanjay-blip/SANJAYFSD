const Facility = require('../models/Facility');
const memoryStore = require('../config/store');
const { isMongoConnected } = require('../config/db');

// @route GET /api/facilities
exports.getFacilities = async (req, res) => {
  try {
    let facilities = [];
    if (isMongoConnected()) {
      try {
        facilities = await Facility.find();
      } catch (e) {
        facilities = memoryStore.facilities;
      }
    } else {
      facilities = memoryStore.facilities;
    }
    return res.status(200).json({ success: true, count: facilities.length, facilities });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route GET /api/facilities/:code
exports.getFacilityByCode = async (req, res) => {
  try {
    const { code } = req.params;
    let facility = null;
    if (isMongoConnected()) {
      try {
        facility = await Facility.findOne({ code: code.toUpperCase() });
      } catch (e) {}
    }
    if (!facility) {
      facility = memoryStore.facilities.find((f) => f.code === code.toUpperCase());
    }

    if (!facility) {
      return res.status(404).json({ success: false, message: 'Facility not found.' });
    }
    return res.status(200).json({ success: true, facility });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @route PUT /api/facilities/:code (Admin only)
exports.updateFacility = async (req, res) => {
  try {
    const { code } = req.params;
    const updates = req.body;

    let updated = null;
    if (isMongoConnected()) {
      try {
        updated = await Facility.findOneAndUpdate({ code: code.toUpperCase() }, updates, { new: true });
      } catch (e) {}
    }

    const idx = memoryStore.facilities.findIndex((f) => f.code === code.toUpperCase());
    if (idx !== -1) {
      memoryStore.facilities[idx] = { ...memoryStore.facilities[idx], ...updates };
      if (!updated) updated = memoryStore.facilities[idx];
    }

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Facility not found.' });
    }
    return res.status(200).json({ success: true, facility: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
