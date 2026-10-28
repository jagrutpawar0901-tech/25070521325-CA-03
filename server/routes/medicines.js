const express = require('express');
const router = express.Router();
const { Medicine, MedicineBatch, InventoryTransaction } = require('../models/Medicine');
const { protect, authorize } = require('../middleware/auth');
const { sendSuccess, sendError, paginate, paginatedResponse } = require('../utils/apiHelpers');
const mongoose = require('mongoose');

// GET all medicines
router.get('/', protect, async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const filter = { isActive: true };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.search) filter.$text = { $search: req.query.search };
    if (req.query.lowStock === 'true') {
      filter.$expr = { $lte: ['$totalStock', '$reorderLevel'] };
    }

    const [medicines, total] = await Promise.all([
      Medicine.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
      Medicine.countDocuments(filter)
    ]);
    paginatedResponse(res, medicines, total, page, limit);
  } catch (err) { sendError(res, err.message); }
});

router.post('/', protect, authorize('admin', 'pharmacist'), async (req, res) => {
  try {
    const medicine = await Medicine.create(req.body);
    sendSuccess(res, medicine, 'Medicine added.', 201);
  } catch (err) { sendError(res, err.message); }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) return sendError(res, 'Medicine not found.', 404);
    // Get active batches
    const batches = await MedicineBatch.find({ medicine: req.params.id, remainingQuantity: { $gt: 0 } }).sort({ expiryDate: 1 });
    sendSuccess(res, { ...medicine.toObject(), batches });
  } catch (err) { sendError(res, err.message); }
});

router.patch('/:id', protect, authorize('admin', 'pharmacist'), async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!medicine) return sendError(res, 'Medicine not found.', 404);
    sendSuccess(res, medicine, 'Medicine updated.');
  } catch (err) { sendError(res, err.message); }
});

// POST /api/medicines/:id/receive — Receive stock batch
router.post('/:id/receive', protect, authorize('admin', 'pharmacist'), async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { batchNumber, expiryDate, quantity, sellingPrice, purchasePrice, supplier } = req.body;

    if (!quantity || quantity <= 0) {
      await session.abortTransaction();
      return sendError(res, 'Quantity must be positive.', 400);
    }

    const batch = await MedicineBatch.create([{
      medicine: req.params.id,
      batchNumber,
      expiryDate,
      quantity,
      remainingQuantity: quantity,
      sellingPrice,
      purchasePrice,
      supplier,
      receivedDate: new Date()
    }], { session });

    await Medicine.findByIdAndUpdate(req.params.id, { $inc: { totalStock: quantity } }, { session });

    await InventoryTransaction.create([{
      medicine: req.params.id,
      batch: batch[0]._id,
      type: 'received',
      quantity,
      unitPrice: purchasePrice,
      totalAmount: purchasePrice * quantity,
      performedBy: req.user._id,
      notes: `Batch ${batchNumber} received from ${supplier || 'supplier'}`
    }], { session });

    await session.commitTransaction();
    sendSuccess(res, batch[0], `Received ${quantity} units successfully.`, 201);
  } catch (err) {
    await session.abortTransaction();
    sendError(res, err.message);
  } finally {
    session.endSession();
  }
});

// POST /api/medicines/:id/dispense
router.post('/:id/dispense', protect, authorize('admin', 'pharmacist'), async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { quantity, prescriptionId, patientId } = req.body;

    if (!quantity || quantity <= 0) {
      await session.abortTransaction();
      return sendError(res, 'Quantity must be positive.', 400);
    }

    // Find suitable batch (FEFO — First Expiry First Out), excluding expired batches
    const batch = await MedicineBatch.findOneAndUpdate(
      {
        medicine: req.params.id,
        remainingQuantity: { $gte: quantity },
        expiryDate: { $gt: new Date() },
        status: 'active'
      },
      { $inc: { remainingQuantity: -quantity } },
      { new: true, sort: { expiryDate: 1 }, session }
    );

    if (!batch) {
      await session.abortTransaction();
      const med = await Medicine.findById(req.params.id);
      if (med && med.totalStock < quantity) {
        return sendError(res, 'Insufficient stock.', 409);
      }
      return sendError(res, 'No valid non-expired batch available. Dispensing expired medicine is not permitted.', 409);
    }

    await Medicine.findByIdAndUpdate(req.params.id, { $inc: { totalStock: -quantity } }, { session });

    await InventoryTransaction.create([{
      medicine: req.params.id,
      batch: batch._id,
      type: 'dispensed',
      quantity,
      unitPrice: batch.sellingPrice,
      totalAmount: (batch.sellingPrice || 0) * quantity,
      reference: prescriptionId,
      patient: patientId,
      performedBy: req.user._id
    }], { session });

    await session.commitTransaction();
    sendSuccess(res, { batch, quantity }, `${quantity} units dispensed successfully.`);
  } catch (err) {
    await session.abortTransaction();
    sendError(res, err.message);
  } finally {
    session.endSession();
  }
});

// GET /api/medicines/alerts/low-stock
router.get('/alerts/low-stock', protect, authorize('admin', 'pharmacist'), async (req, res) => {
  try {
    const medicines = await Medicine.find({
      isActive: true,
      $expr: { $lte: ['$totalStock', '$reorderLevel'] }
    });
    sendSuccess(res, medicines);
  } catch (err) { sendError(res, err.message); }
});

// GET /api/medicines/alerts/near-expiry
router.get('/alerts/near-expiry', protect, authorize('admin', 'pharmacist'), async (req, res) => {
  try {
    const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const batches = await MedicineBatch.find({
      expiryDate: { $lte: thirtyDaysLater, $gte: new Date() },
      remainingQuantity: { $gt: 0 },
      status: 'active'
    }).populate('medicine', 'name medicineId');
    sendSuccess(res, batches);
  } catch (err) { sendError(res, err.message); }
});

module.exports = router;
