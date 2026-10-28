const express = require('express');
const router = express.Router();
const { Ward, Room, Bed } = require('../models/Bed');
const { protect, authorize } = require('../middleware/auth');
const { sendSuccess, sendError, paginate, paginatedResponse } = require('../utils/apiHelpers');

// ─── Beds ─────────────────────────────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.ward) filter.ward = req.query.ward;
    if (req.query.type) filter.type = req.query.type;

    const [beds, total] = await Promise.all([
      Bed.find(filter)
        .populate('ward', 'name type')
        .populate('room', 'roomNumber')
        .populate('currentPatient', 'name patientId')
        .sort({ bedNumber: 1 })
        .skip(skip).limit(limit),
      Bed.countDocuments(filter)
    ]);
    paginatedResponse(res, beds, total, page, limit);
  } catch (err) {
    sendError(res, err.message);
  }
});

router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const bed = await Bed.create(req.body);
    // Increment ward bed count
    await Ward.findByIdAndUpdate(req.body.ward, { $inc: { totalBeds: 1 } });
    sendSuccess(res, bed, 'Bed created.', 201);
  } catch (err) {
    sendError(res, err.message);
  }
});

router.patch('/:id', protect, authorize('admin', 'nurse'), async (req, res) => {
  try {
    const bed = await Bed.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!bed) return sendError(res, 'Bed not found.', 404);
    sendSuccess(res, bed, 'Bed updated.');
  } catch (err) {
    sendError(res, err.message);
  }
});

// GET bed stats
router.get('/stats/summary', protect, async (req, res) => {
  try {
    const stats = await Bed.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const result = { available: 0, occupied: 0, reserved: 0, cleaning: 0, maintenance: 0, total: 0 };
    stats.forEach(s => {
      result[s._id] = s.count;
      result.total += s.count;
    });
    sendSuccess(res, result);
  } catch (err) {
    sendError(res, err.message);
  }
});

module.exports = router;
