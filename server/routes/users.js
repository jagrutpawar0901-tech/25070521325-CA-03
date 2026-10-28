const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { sendSuccess, sendError, paginate, paginatedResponse } = require('../utils/apiHelpers');

// GET /api/users — Admin only
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter)
    ]);
    paginatedResponse(res, users, total, page, limit);
  } catch (err) {
    sendError(res, err.message);
  }
});

// POST /api/users — Admin creates staff accounts
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, email, password, role, phone, department } = req.body;
    const existing = await User.findOne({ email: email?.toLowerCase() });
    if (existing) return sendError(res, 'Email already in use.', 409);
    const user = await User.create({ name, email, password, role, phone, department });
    sendSuccess(res, user, 'User created successfully.', 201);
  } catch (err) {
    sendError(res, err.message);
  }
});

// GET /api/users/:id
router.get('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, 'User not found.', 404);
    sendSuccess(res, user);
  } catch (err) {
    sendError(res, err.message);
  }
});

// PATCH /api/users/:id
router.patch('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const forbidden = ['password', 'passwordResetToken', 'passwordResetExpires'];
    forbidden.forEach(f => delete req.body[f]);
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!user) return sendError(res, 'User not found.', 404);
    sendSuccess(res, user, 'User updated.');
  } catch (err) {
    sendError(res, err.message);
  }
});

// DELETE /api/users/:id (deactivate, not permanent delete)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return sendError(res, 'You cannot deactivate your own account.', 400);
    }
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) return sendError(res, 'User not found.', 404);
    sendSuccess(res, null, 'User deactivated.');
  } catch (err) {
    sendError(res, err.message);
  }
});

// PATCH /api/users/:id/preferences — Own user preferences
router.patch('/:id/preferences', protect, async (req, res) => {
  try {
    if (req.params.id !== req.user._id.toString() && req.user.role !== 'admin') {
      return sendError(res, 'Forbidden.', 403);
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { preferences: req.body },
      { new: true }
    );
    sendSuccess(res, user, 'Preferences updated.');
  } catch (err) {
    sendError(res, err.message);
  }
});

module.exports = router;
