const express = require('express');
const router = express.Router();
const { BloodInventory } = require('../models/BloodAndEquipment');
const { protect, authorize } = require('../middleware/auth');
const { sendSuccess, sendError } = require('../utils/apiHelpers');

router.get('/', protect, async (req, res) => {
  try {
    const filter = {};
    if (req.query.bloodGroup) filter.bloodGroup = req.query.bloodGroup;
    if (req.query.component) filter.component = req.query.component;
    if (req.query.status) filter.status = req.query.status;

    const inventory = await BloodInventory.find(filter).sort({ bloodGroup: 1, component: 1 });
    sendSuccess(res, inventory);
  } catch (err) { sendError(res, err.message); }
});

router.get('/summary', protect, async (req, res) => {
  try {
    const summary = await BloodInventory.aggregate([
      { $match: { status: 'available', expiryDate: { $gt: new Date() } } },
      { $group: { _id: { bloodGroup: '$bloodGroup', component: '$component' }, totalUnits: { $sum: '$availableUnits' } } },
      { $sort: { '_id.bloodGroup': 1 } }
    ]);
    sendSuccess(res, summary);
  } catch (err) { sendError(res, err.message); }
});

router.post('/', protect, authorize('admin', 'lab_staff'), async (req, res) => {
  try {
    const entry = await BloodInventory.create({ ...req.body, addedBy: req.user._id });
    sendSuccess(res, entry, 'Blood inventory entry added.', 201);
  } catch (err) { sendError(res, err.message); }
});

router.patch('/:id', protect, authorize('admin', 'lab_staff'), async (req, res) => {
  try {
    const entry = await BloodInventory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!entry) return sendError(res, 'Entry not found.', 404);
    sendSuccess(res, entry, 'Blood inventory updated.');
  } catch (err) { sendError(res, err.message); }
});

module.exports = router;
