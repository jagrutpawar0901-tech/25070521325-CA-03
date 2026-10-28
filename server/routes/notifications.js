const express = require('express');
const router = express.Router();
const { Notification } = require('../models/Misc');
const { protect } = require('../middleware/auth');
const { sendSuccess, sendError, paginate, paginatedResponse } = require('../utils/apiHelpers');

router.get('/', protect, async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const filter = { recipient: req.user._id };
    if (req.query.type) filter.type = req.query.type;
    if (req.query.isRead !== undefined) filter.isRead = req.query.isRead === 'true';

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipient: req.user._id, isRead: false })
    ]);
    paginatedResponse(res, notifications, total, page, limit, 'Success');
    // Override to include unreadCount
  } catch (err) { sendError(res, err.message); }
});

router.get('/unread-count', protect, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
    sendSuccess(res, { count });
  } catch (err) { sendError(res, err.message); }
});

router.patch('/:id/read', protect, async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    if (!notif) return sendError(res, 'Notification not found.', 404);
    sendSuccess(res, notif, 'Marked as read.');
  } catch (err) { sendError(res, err.message); }
});

router.patch('/mark-all-read', protect, async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true, readAt: new Date() });
    sendSuccess(res, null, 'All notifications marked as read.');
  } catch (err) { sendError(res, err.message); }
});

module.exports = router;
