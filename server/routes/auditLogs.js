const express = require('express');
const router = express.Router();
const { AuditLog } = require('../models/Misc');
const { protect, authorize } = require('../middleware/auth');
const { sendSuccess, sendError, paginate, paginatedResponse } = require('../utils/apiHelpers');

router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const filter = {};
    if (req.query.module) filter.module = req.query.module;
    if (req.query.actor) filter.actor = req.query.actor;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.from && req.query.to) {
      filter.createdAt = { $gte: new Date(req.query.from), $lte: new Date(req.query.to) };
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter).populate('actor', 'name email role').sort({ createdAt: -1 }).skip(skip).limit(limit),
      AuditLog.countDocuments(filter)
    ]);
    paginatedResponse(res, logs, total, page, limit);
  } catch (err) { sendError(res, err.message); }
});

module.exports = router;
