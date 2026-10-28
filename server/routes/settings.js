const express = require('express');
const router = express.Router();
const { HospitalSetting } = require('../models/Misc');
const { protect, authorize } = require('../middleware/auth');
const { sendSuccess, sendError } = require('../utils/apiHelpers');
const Department = require('../models/Department');

// GET all settings
router.get('/', protect, async (req, res) => {
  try {
    const settings = await HospitalSetting.find();
    const result = {};
    settings.forEach(s => { result[s.key] = s.value; });
    sendSuccess(res, result);
  } catch (err) { sendError(res, err.message); }
});

// PATCH settings (admin only)
router.patch('/', protect, authorize('admin'), async (req, res) => {
  try {
    const ops = Object.entries(req.body).map(([key, value]) => ({
      updateOne: {
        filter: { key },
        update: { $set: { key, value, updatedBy: req.user._id } },
        upsert: true
      }
    }));
    await HospitalSetting.bulkWrite(ops);
    sendSuccess(res, req.body, 'Settings saved.');
  } catch (err) { sendError(res, err.message); }
});

// Departments
router.get('/departments', protect, async (req, res) => {
  try {
    const depts = await Department.find({ isActive: true }).sort({ name: 1 });
    sendSuccess(res, depts);
  } catch (err) { sendError(res, err.message); }
});

module.exports = router;
