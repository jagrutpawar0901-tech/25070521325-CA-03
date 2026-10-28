const express = require('express');
const router = express.Router();
const { Room } = require('../models/Bed');
const { protect, authorize } = require('../middleware/auth');
const { sendSuccess, sendError } = require('../utils/apiHelpers');

router.get('/', protect, async (req, res) => {
  try {
    const filter = {};
    if (req.query.ward) filter.ward = req.query.ward;
    const rooms = await Room.find(filter).populate('ward', 'name type').sort({ roomNumber: 1 });
    sendSuccess(res, rooms);
  } catch (err) { sendError(res, err.message); }
});

router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const room = await Room.create(req.body);
    sendSuccess(res, room, 'Room created.', 201);
  } catch (err) { sendError(res, err.message); }
});

router.patch('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!room) return sendError(res, 'Room not found.', 404);
    sendSuccess(res, room, 'Room updated.');
  } catch (err) { sendError(res, err.message); }
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await Room.findByIdAndDelete(req.params.id);
    sendSuccess(res, null, 'Room deleted.');
  } catch (err) { sendError(res, err.message); }
});

module.exports = router;
