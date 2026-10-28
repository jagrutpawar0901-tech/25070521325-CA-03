const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { Payment, Invoice } = require('../models/Invoice');
const { protect, authorize } = require('../middleware/auth');
const { sendSuccess, sendError, paginate, paginatedResponse } = require('../utils/apiHelpers');

// GET /api/payments
router.get('/', protect, async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const filter = {};

    if (req.user.role === 'patient') {
      filter.patient = req.user.linkedPatientId;
    } else if (req.query.patient) {
      filter.patient = req.query.patient;
    }

    if (req.query.invoice) filter.invoice = req.query.invoice;
    if (req.query.method) filter.method = req.query.method;

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('patient', 'firstName lastName patientId phone')
        .populate('invoice', 'invoiceNumber grandTotal paidAmount status')
        .populate('processedBy', 'name role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Payment.countDocuments(filter)
    ]);

    paginatedResponse(res, payments, total, page, limit);
  } catch (err) {
    sendError(res, err.message);
  }
});

// GET /api/payments/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('patient', 'firstName lastName patientId phone email address')
      .populate('invoice')
      .populate('processedBy', 'name');

    if (!payment) return sendError(res, 'Payment record not found.', 404);
    sendSuccess(res, payment);
  } catch (err) {
    sendError(res, err.message);
  }
});

// POST /api/payments - record payment manually or after gateway
router.post('/', protect, authorize('admin', 'billing', 'receptionist'), async (req, res) => {
  try {
    const { invoiceId, amount, method, transactionId, notes } = req.body;
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) return sendError(res, 'Invoice not found.', 404);

    const payAmount = Number(amount);
    if (isNaN(payAmount) || payAmount <= 0) return sendError(res, 'Invalid payment amount.', 400);

    const payment = await Payment.create({
      invoice: invoice._id,
      patient: invoice.patient,
      amount: payAmount,
      method: method || 'cash',
      transactionId: transactionId || `TXN${Date.now()}`,
      notes,
      processedBy: req.user._id,
      status: 'completed'
    });

    // Update invoice balance
    invoice.paidAmount = (invoice.paidAmount || 0) + payAmount;
    invoice.outstandingAmount = Math.max(0, invoice.grandTotal - invoice.paidAmount);
    if (invoice.outstandingAmount <= 0) {
      invoice.status = 'paid';
    } else {
      invoice.status = 'partially-paid';
    }
    await invoice.save();

    sendSuccess(res, { payment, invoice }, 'Payment recorded successfully.', 201);
  } catch (err) {
    sendError(res, err.message);
  }
});

// POST /api/payments/razorpay/order
router.post('/razorpay/order', protect, async (req, res) => {
  try {
    const { invoiceId, amount } = req.body;
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) return sendError(res, 'Invoice not found.', 404);

    // If Razorpay keys exist, use official SDK, else return demo simulated order
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      const Razorpay = require('razorpay');
      const instance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
      });
      const order = await instance.orders.create({
        amount: Math.round(amount * 100),
        currency: 'INR',
        receipt: `RCP_${invoice.invoiceNumber}`,
      });
      return sendSuccess(res, { order, keyId: process.env.RAZORPAY_KEY_ID });
    }

    // Mock order for demo / college presentation
    const mockOrder = {
      id: `order_mock_${Date.now()}`,
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `RCP_${invoice.invoiceNumber}`,
      status: 'created',
      isDemo: true
    };
    sendSuccess(res, { order: mockOrder, keyId: 'rzp_test_mock_mode' });
  } catch (err) {
    sendError(res, err.message);
  }
});

// POST /api/payments/razorpay/verify
router.post('/razorpay/verify', protect, async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, invoiceId, amount } = req.body;
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) return sendError(res, 'Invoice not found.', 404);

    // Verify signature if keys configured
    if (process.env.RAZORPAY_KEY_SECRET && razorpaySignature) {
      const body = razorpayOrderId + '|' + razorpayPaymentId;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

      if (expectedSignature !== razorpaySignature) {
        return sendError(res, 'Invalid payment signature verification.', 400);
      }
    }

    const payAmount = Number(amount);
    const payment = await Payment.create({
      invoice: invoice._id,
      patient: invoice.patient,
      amount: payAmount,
      method: 'online',
      status: 'completed',
      razorpayOrderId,
      razorpayPaymentId: razorpayPaymentId || `sim_pay_${Date.now()}`,
      razorpaySignature,
      processedBy: req.user._id
    });

    invoice.paidAmount = (invoice.paidAmount || 0) + payAmount;
    invoice.outstandingAmount = Math.max(0, invoice.grandTotal - invoice.paidAmount);
    invoice.status = invoice.outstandingAmount <= 0 ? 'paid' : 'partially-paid';
    await invoice.save();

    sendSuccess(res, { payment, invoice }, 'Payment verified and completed.');
  } catch (err) {
    sendError(res, err.message);
  }
});

module.exports = router;
