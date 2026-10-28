const express = require('express');
const router = express.Router();
const { Ward } = require('../models/Bed');
const { protect, authorize } = require('../middleware/auth');
const { sendSuccess, sendError } = require('../utils/apiHelpers');

router.get('/', protect, async (req, res) => {
  try {
    const wards = await Ward.find().sort({ name: 1 });
    sendSuccess(res, wards);
  } catch (err) { sendError(res, err.message); }
});

router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const ward = await Ward.create(req.body);
    sendSuccess(res, ward, 'Ward created.', 201);
  } catch (err) { sendError(res, err.message); }
});

router.patch('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const ward = await Ward.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!ward) return sendError(res, 'Ward not found.', 404);
    sendSuccess(res, ward, 'Ward updated.');
  } catch (err) { sendError(res, err.message); }
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await Ward.findByIdAndDelete(req.params.id);
    sendSuccess(res, null, 'Ward deleted.');
  } catch (err) { sendError(res, err.message); }
});

module.exports = router;
