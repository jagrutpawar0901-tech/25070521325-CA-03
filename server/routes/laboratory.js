const express = require('express');
const router = express.Router();
const { LabTestCatalog, LabOrder } = require('../models/Laboratory');
const { protect, authorize } = require('../middleware/auth');
const { sendSuccess, sendError, paginate, paginatedResponse } = require('../utils/apiHelpers');

// Test Catalog
router.get('/catalog', protect, async (req, res) => {
  try {
    const tests = await LabTestCatalog.find({ isActive: true }).sort({ name: 1 });
    sendSuccess(res, tests);
  } catch (err) { sendError(res, err.message); }
});

router.post('/catalog', protect, authorize('admin', 'lab_staff'), async (req, res) => {
  try {
    const test = await LabTestCatalog.create(req.body);
    sendSuccess(res, test, 'Test added to catalog.', 201);
  } catch (err) { sendError(res, err.message); }
});

// Lab Orders
router.get('/orders', protect, async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const filter = {};
    if (req.user.role === 'patient' && req.user.linkedPatientId) {
      filter.patient = req.user.linkedPatientId;
    }
    if (req.query.patient) filter.patient = req.query.patient;
    if (req.query.status) filter.status = req.query.status;

    const [orders, total] = await Promise.all([
      LabOrder.find(filter)
        .populate('patient', 'name patientId')
        .populate('doctor', 'name specialty')
        .populate('tests.test', 'name category price')
        .sort({ createdAt: -1 })
        .skip(skip).limit(limit),
      LabOrder.countDocuments(filter)
    ]);
    paginatedResponse(res, orders, total, page, limit);
  } catch (err) { sendError(res, err.message); }
});

router.post('/orders', protect, authorize('admin', 'doctor', 'receptionist', 'lab_staff'), async (req, res) => {
  try {
    // Calculate total
    let total = 0;
    for (const t of req.body.tests || []) {
      const catalog = await LabTestCatalog.findById(t.test);
      if (catalog) {
        t.testName = catalog.name;
        t.price = catalog.price;
        total += catalog.price;
      }
    }
    const order = await LabOrder.create({ ...req.body, totalAmount: total, createdBy: req.user._id });
    await order.populate(['patient', 'doctor']);
    sendSuccess(res, order, 'Lab order created.', 201);
  } catch (err) { sendError(res, err.message); }
});

router.get('/orders/:id', protect, async (req, res) => {
  try {
    const order = await LabOrder.findById(req.params.id)
      .populate('patient', 'name patientId phone dateOfBirth')
      .populate('doctor', 'name specialty')
      .populate('tests.test', 'name category referenceRanges')
      .populate('sampleCollectedBy', 'name');
    if (!order) return sendError(res, 'Lab order not found.', 404);
    sendSuccess(res, order);
  } catch (err) { sendError(res, err.message); }
});

// PATCH /api/laboratory/orders/:id/collect — Mark sample collected
router.patch('/orders/:id/collect', protect, authorize('admin', 'lab_staff'), async (req, res) => {
  try {
    const order = await LabOrder.findByIdAndUpdate(req.params.id, {
      status: 'sample-collected',
      sampleCollectedAt: new Date(),
      sampleCollectedBy: req.user._id,
      'tests.$[].status': 'sample-collected'
    }, { new: true });
    sendSuccess(res, order, 'Sample collection recorded.');
  } catch (err) { sendError(res, err.message); }
});

// PATCH /api/laboratory/orders/:id/results — Enter test results
router.patch('/orders/:id/results', protect, authorize('admin', 'lab_staff'), async (req, res) => {
  try {
    const order = await LabOrder.findById(req.params.id);
    if (!order) return sendError(res, 'Order not found.', 404);

    // Update individual test results
    for (const r of req.body.results || []) {
      const test = order.tests.id(r.testId);
      if (test) {
        test.result = r.result;
        test.status = 'completed';
        test.completedAt = new Date();
        if (r.reportUrl) test.reportUrl = r.reportUrl;
      }
    }

    const allDone = order.tests.every(t => t.status === 'completed');
    if (allDone) order.status = 'completed';
    else order.status = 'processing';

    await order.save();
    sendSuccess(res, order, 'Results recorded.');
  } catch (err) { sendError(res, err.message); }
});

module.exports = router;
