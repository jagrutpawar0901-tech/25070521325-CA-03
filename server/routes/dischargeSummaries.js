const express = require('express');
const router = express.Router();
const { DischargeSummary } = require('../models/Misc');
const Admission = require('../models/Admission');
const { protect, authorize } = require('../middleware/auth');
const { sendSuccess, sendError, paginate, paginatedResponse } = require('../utils/apiHelpers');

// GET /api/discharge-summaries
router.get('/', protect, async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const filter = {};

    if (req.user.role === 'patient') {
      filter.patient = req.user.linkedPatientId;
    } else if (req.query.patient) {
      filter.patient = req.query.patient;
    }

    if (req.query.status) filter.status = req.query.status;

    const [summaries, total] = await Promise.all([
      DischargeSummary.find(filter)
        .populate('patient', 'firstName lastName patientId phone bloodGroup')
        .populate('doctor', 'name specialization qualifications')
        .populate('admission', 'admissionId admissionDate dischargeDate')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      DischargeSummary.countDocuments(filter)
    ]);

    paginatedResponse(res, summaries, total, page, limit);
  } catch (err) {
    sendError(res, err.message);
  }
});

// GET /api/discharge-summaries/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const summary = await DischargeSummary.findById(req.params.id)
      .populate('patient', 'firstName lastName patientId phone bloodGroup allergies dateOfBirth gender address')
      .populate('doctor', 'name specialization qualifications roomNumber department')
      .populate('admission')
      .populate('approvedBy', 'name role');

    if (!summary) return sendError(res, 'Discharge summary not found.', 404);
    sendSuccess(res, summary);
  } catch (err) {
    sendError(res, err.message);
  }
});

// POST /api/discharge-summaries
router.post('/', protect, authorize('doctor', 'admin'), async (req, res) => {
  try {
    const summary = await DischargeSummary.create({
      ...req.body,
      doctor: req.user.linkedDoctorId || req.body.doctor,
      status: req.body.status || 'draft'
    });

    sendSuccess(res, summary, 'Discharge summary created successfully.', 201);
  } catch (err) {
    sendError(res, err.message);
  }
});

// PATCH /api/discharge-summaries/:id
router.patch('/:id', protect, authorize('doctor', 'admin'), async (req, res) => {
  try {
    const existing = await DischargeSummary.findById(req.params.id);
    if (!existing) return sendError(res, 'Discharge summary not found.', 404);

    // Track versions
    const versionEntry = {
      content: { ...existing.toObject() },
      savedAt: new Date(),
      savedBy: req.user._id
    };

    const updated = await DischargeSummary.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        $push: { versions: versionEntry }
      },
      { new: true }
    );

    sendSuccess(res, updated, 'Discharge summary updated.');
  } catch (err) {
    sendError(res, err.message);
  }
});

// POST /api/discharge-summaries/:id/approve
router.post('/:id/approve', protect, authorize('doctor', 'admin'), async (req, res) => {
  try {
    const summary = await DischargeSummary.findByIdAndUpdate(
      req.params.id,
      {
        status: 'approved',
        approvedBy: req.user._id,
        approvedAt: new Date()
      },
      { new: true }
    );

    if (!summary) return sendError(res, 'Discharge summary not found.', 404);

    // If associated admission is still active, update admission status to discharged
    if (summary.admission) {
      await Admission.findByIdAndUpdate(summary.admission, {
        status: 'discharged',
        dischargeDate: summary.dischargeDate || new Date()
      });
    }

    sendSuccess(res, summary, 'Discharge summary approved and finalized.');
  } catch (err) {
    sendError(res, err.message);
  }
});

module.exports = router;
