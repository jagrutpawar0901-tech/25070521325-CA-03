const express = require('express');
const router = express.Router();
const { MedicalRecord } = require('../models/Misc');
const { protect, authorize } = require('../middleware/auth');
const { sendSuccess, sendError, paginate, paginatedResponse } = require('../utils/apiHelpers');

// GET /api/medical-records
router.get('/', protect, async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const filter = {};

    // Patient can only see their own medical records
    if (req.user.role === 'patient') {
      filter.patient = req.user.linkedPatientId;
    } else if (req.query.patient) {
      filter.patient = req.query.patient;
    }

    if (req.query.doctor) filter.doctor = req.query.doctor;
    if (req.query.type) filter.type = req.query.type;

    const [records, total] = await Promise.all([
      MedicalRecord.find(filter)
        .populate('patient', 'firstName lastName patientId bloodGroup dateOfBirth gender')
        .populate('doctor', 'name specialization qualifications')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      MedicalRecord.countDocuments(filter)
    ]);

    paginatedResponse(res, records, total, page, limit);
  } catch (err) {
    sendError(res, err.message);
  }
});

// GET /api/medical-records/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id)
      .populate('patient', 'firstName lastName patientId bloodGroup allergies dateOfBirth gender')
      .populate('doctor', 'name specialization qualifications');

    if (!record) return sendError(res, 'Medical record not found.', 404);

    if (req.user.role === 'patient' && req.user.linkedPatientId?.toString() !== record.patient._id.toString()) {
      return sendError(res, 'Access denied.', 403);
    }

    // Log access
    record.accessLog.push({ user: req.user._id });
    await record.save();

    sendSuccess(res, record);
  } catch (err) {
    sendError(res, err.message);
  }
});

// POST /api/medical-records
router.post('/', protect, authorize('doctor', 'admin', 'nurse'), async (req, res) => {
  try {
    const record = await MedicalRecord.create({
      ...req.body,
      doctor: req.user.linkedDoctorId || req.body.doctor
    });
    sendSuccess(res, record, 'Medical record created successfully.', 201);
  } catch (err) {
    sendError(res, err.message);
  }
});

// PATCH /api/medical-records/:id
router.patch('/:id', protect, authorize('doctor', 'admin'), async (req, res) => {
  try {
    const record = await MedicalRecord.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!record) return sendError(res, 'Medical record not found.', 404);
    sendSuccess(res, record, 'Medical record updated.');
  } catch (err) {
    sendError(res, err.message);
  }
});

// DELETE /api/medical-records/:id (Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const record = await MedicalRecord.findByIdAndDelete(req.params.id);
    if (!record) return sendError(res, 'Medical record not found.', 404);
    sendSuccess(res, null, 'Medical record deleted.');
  } catch (err) {
    sendError(res, err.message);
  }
});

module.exports = router;
