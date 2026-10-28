const express = require('express');
const router = express.Router();
const { Invoice, Payment } = require('../models/Invoice');
const { protect, authorize } = require('../middleware/auth');
const { sendSuccess, sendError, paginate, paginatedResponse } = require('../utils/apiHelpers');

router.get('/', protect, authorize('admin', 'billing', 'receptionist', 'doctor', 'patient'), async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const filter = {};
    if (req.user.role === 'patient' && req.user.linkedPatientId) {
      filter.patient = req.user.linkedPatientId;
    }
    if (req.query.patient) filter.patient = req.query.patient;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.from && req.query.to) {
      filter.createdAt = { $gte: new Date(req.query.from), $lte: new Date(req.query.to) };
    }

    const [invoices, total] = await Promise.all([
      Invoice.find(filter)
        .populate('patient', 'name patientId phone')
        .sort({ createdAt: -1 })
        .skip(skip).limit(limit),
      Invoice.countDocuments(filter)
    ]);
    paginatedResponse(res, invoices, total, page, limit);
  } catch (err) { sendError(res, err.message); }
});

router.post('/', protect, authorize('admin', 'billing', 'receptionist'), async (req, res) => {
  try {
    const invoice = await Invoice.create({ ...req.body, createdBy: req.user._id });
    await invoice.populate('patient', 'name patientId phone');
    sendSuccess(res, invoice, 'Invoice created.', 201);
  } catch (err) { sendError(res, err.message); }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('patient', 'name patientId phone address email')
      .populate('admission', 'admissionId admissionDate')
      .populate('appointment', 'appointmentId scheduledDate');
    if (!invoice) return sendError(res, 'Invoice not found.', 404);

    // Access control for patients
    if (req.user.role === 'patient' &&
        req.user.linkedPatientId?.toString() !== invoice.patient._id.toString()) {
      return sendError(res, 'Access denied.', 403);
    }

    // Get payments for this invoice
    const payments = await Payment.find({ invoice: req.params.id }).populate('processedBy', 'name');
    sendSuccess(res, { ...invoice.toObject(), payments });
  } catch (err) { sendError(res, err.message); }
});

router.patch('/:id', protect, authorize('admin', 'billing'), async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!invoice) return sendError(res, 'Invoice not found.', 404);
    sendSuccess(res, invoice, 'Invoice updated.');
  } catch (err) { sendError(res, err.message); }
});

// POST /api/invoices/:id/payment
router.post('/:id/payment', protect, authorize('admin', 'billing', 'receptionist'), async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return sendError(res, 'Invoice not found.', 404);
    if (invoice.status === 'paid') return sendError(res, 'Invoice is already fully paid.', 400);
    if (invoice.status === 'cancelled') return sendError(res, 'Cannot accept payment for cancelled invoice.', 400);

    const { amount, method, notes, transactionId } = req.body;
    if (!amount || amount <= 0) return sendError(res, 'Invalid payment amount.', 400);
    if (amount > invoice.outstandingAmount) {
      return sendError(res, `Payment amount exceeds outstanding balance of ₹${invoice.outstandingAmount}.`, 400);
    }

    const payment = await Payment.create({
      invoice: invoice._id,
      patient: invoice.patient,
      amount,
      method,
      notes,
      transactionId,
      processedBy: req.user._id,
      status: 'completed'
    });

    invoice.paidAmount += amount;
    invoice.outstandingAmount = invoice.grandTotal - invoice.paidAmount;
    invoice.status = invoice.outstandingAmount <= 0 ? 'paid' : 'partially-paid';
    await invoice.save();

    sendSuccess(res, { payment, invoice }, 'Payment recorded successfully.', 201);
  } catch (err) { sendError(res, err.message); }
});

module.exports = router;
