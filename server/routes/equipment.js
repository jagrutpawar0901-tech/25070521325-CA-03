const express = require('express');
const router = express.Router();
const { Equipment } = require('../models/BloodAndEquipment');
const { protect, authorize } = require('../middleware/auth');
const { sendSuccess, sendError, paginate, paginatedResponse } = require('../utils/apiHelpers');

router.get('/', protect, async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.department) filter.department = req.query.department;
    if (req.query.category) filter.category = { $regex: req.query.category, $options: 'i' };

    const [equipment, total] = await Promise.all([
      Equipment.find(filter).populate('department', 'name').sort({ name: 1 }).skip(skip).limit(limit),
      Equipment.countDocuments(filter)
    ]);
    paginatedResponse(res, equipment, total, page, limit);
  } catch (err) { sendError(res, err.message); }
});

router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const item = await Equipment.create(req.body);
    sendSuccess(res, item, 'Equipment added.', 201);
  } catch (err) { sendError(res, err.message); }
});

router.patch('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const item = await Equipment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return sendError(res, 'Equipment not found.', 404);
    sendSuccess(res, item, 'Equipment updated.');
  } catch (err) { sendError(res, err.message); }
});

// POST /api/equipment/:id/maintenance
router.post('/:id/maintenance', protect, authorize('admin'), async (req, res) => {
  try {
    const { description, cost, technician, type } = req.body;
    const item = await Equipment.findByIdAndUpdate(req.params.id, {
      $push: { serviceHistory: { date: new Date(), type, description, cost, technician } },
      status: 'maintenance',
      lastMaintenanceDate: new Date()
    }, { new: true });
    if (!item) return sendError(res, 'Equipment not found.', 404);
    sendSuccess(res, item, 'Maintenance record added.');
  } catch (err) { sendError(res, err.message); }
});

module.exports = router;
