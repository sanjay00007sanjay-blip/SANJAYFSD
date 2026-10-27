const express = require('express');
const router = express.Router();
const { getFacilities, getFacilityByCode, updateFacility } = require('../controllers/facilityController');

router.get('/', getFacilities);
router.get('/:code', getFacilityByCode);
router.put('/:code', updateFacility);

module.exports = router;
