const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const { protect, authorize } = require('../middleware/auth');
const { sendSuccess, sendError, paginate, paginatedResponse } = require('../utils/apiHelpers');

const ALLOWED_ROLES = ['admin', 'doctor', 'receptionist', 'nurse', 'billing', 'lab_staff'];

// GET /api/patients
router.get('/', protect, authorize(...ALLOWED_ROLES, 'patient'), async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const filter = { isActive: true };

    // Patients can only see their own record
    if (req.user.role === 'patient' && req.user.linkedPatientId) {
      filter._id = req.user.linkedPatientId;
    }

    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }
    if (req.query.bloodGroup) filter.bloodGroup = req.query.bloodGroup;
    if (req.query.gender) filter.gender = req.query.gender;

    const [patients, total] = await Promise.all([
      Patient.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Patient.countDocuments(filter)
    ]);
    paginatedResponse(res, patients, total, page, limit);
  } catch (err) {
    sendError(res, err.message);
  }
});

// POST /api/patients
router.post('/', protect, authorize('admin', 'receptionist', 'doctor'), async (req, res) => {
  try {
    const patient = await Patient.create(req.body);
    sendSuccess(res, patient, 'Patient registered successfully.', 201);
  } catch (err) {
    if (err.code === 11000) return sendError(res, 'A patient with this information already exists.', 409);
    sendError(res, err.message);
  }
});

// GET /api/patients/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return sendError(res, 'Patient not found.', 404);

    // Role-based access
    if (req.user.role === 'patient' &&
        req.user.linkedPatientId?.toString() !== patient._id.toString()) {
      return sendError(res, 'Access denied.', 403);
    }

    sendSuccess(res, patient);
  } catch (err) {
    sendError(res, err.message);
  }
});

// GET /api/patients/qr/:token — QR lookup
router.get('/qr/:token', protect, async (req, res) => {
  try {
    const patient = await Patient.findOne({ qrToken: req.params.token });
    if (!patient) return sendError(res, 'Invalid or unrecognized QR code.', 404);
    sendSuccess(res, patient);
  } catch (err) {
    sendError(res, err.message);
  }
});

// PATCH /api/patients/:id
router.patch('/:id', protect, authorize('admin', 'receptionist', 'doctor', 'nurse'), async (req, res) => {
  try {
    // Prevent changing protected fields
    delete req.body.patientId;
    delete req.body.qrToken;

    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!patient) return sendError(res, 'Patient not found.', 404);
    sendSuccess(res, patient, 'Patient updated.');
  } catch (err) {
    sendError(res, err.message);
  }
});

// DELETE /api/patients/:id — Soft delete
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!patient) return sendError(res, 'Patient not found.', 404);
    sendSuccess(res, null, 'Patient record archived.');
  } catch (err) {
    sendError(res, err.message);
  }
});

module.exports = router;
