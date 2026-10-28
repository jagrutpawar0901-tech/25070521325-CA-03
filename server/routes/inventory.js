const express = require('express');
const router = express.Router();
const { InventoryTransaction } = require('../models/Medicine');
const { protect, authorize } = require('../middleware/auth');
const { sendSuccess, sendError, paginate, paginatedResponse } = require('../utils/apiHelpers');

router.get('/', protect, authorize('admin', 'pharmacist'), async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const filter = {};
    if (req.query.medicine) filter.medicine = req.query.medicine;
    if (req.query.type) filter.type = req.query.type;

    const [transactions, total] = await Promise.all([
      InventoryTransaction.find(filter)
        .populate('medicine', 'name medicineId')
        .populate('batch', 'batchNumber expiryDate')
        .populate('patient', 'name patientId')
        .populate('performedBy', 'name role')
        .sort({ createdAt: -1 })
        .skip(skip).limit(limit),
      InventoryTransaction.countDocuments(filter)
    ]);
    paginatedResponse(res, transactions, total, page, limit);
  } catch (err) { sendError(res, err.message); }
});

module.exports = router;
