const express = require('express');
const router = express.Router();
const Prescription = require('../models/Prescription');
const { protect, authorize } = require('../middleware/auth');
const { sendSuccess, sendError, paginate, paginatedResponse } = require('../utils/apiHelpers');

router.get('/', protect, async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const filter = {};

    if (req.user.role === 'patient' && req.user.linkedPatientId) {
      filter.patient = req.user.linkedPatientId;
    }
    if (req.user.role === 'doctor' && req.user.linkedDoctorId) {
      filter.doctor = req.user.linkedDoctorId;
    }
    if (req.query.patient) filter.patient = req.query.patient;
    if (req.query.doctor) filter.doctor = req.query.doctor;
    if (req.query.status) filter.status = req.query.status;

    const [prescriptions, total] = await Promise.all([
      Prescription.find(filter)
        .populate('patient', 'name patientId')
        .populate('doctor', 'name specialty')
        .populate('medicines.medicine', 'name')
        .sort({ createdAt: -1 })
        .skip(skip).limit(limit),
      Prescription.countDocuments(filter)
    ]);
    paginatedResponse(res, prescriptions, total, page, limit);
  } catch (err) { sendError(res, err.message); }
});

router.post('/', protect, authorize('admin', 'doctor'), async (req, res) => {
  try {
    const prescription = await Prescription.create({ ...req.body });
    await prescription.populate(['patient', 'doctor']);
    sendSuccess(res, prescription, 'Prescription created.', 201);
  } catch (err) { sendError(res, err.message); }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patient', 'name patientId phone bloodGroup allergies')
      .populate('doctor', 'name specialty registrationNumber qualifications')
      .populate('medicines.medicine', 'name genericName strength category');
    if (!prescription) return sendError(res, 'Prescription not found.', 404);

    // Access control
    if (req.user.role === 'patient' &&
        req.user.linkedPatientId?.toString() !== prescription.patient._id.toString()) {
      return sendError(res, 'Access denied.', 403);
    }
    sendSuccess(res, prescription);
  } catch (err) { sendError(res, err.message); }
});

router.patch('/:id', protect, authorize('admin', 'doctor', 'pharmacist'), async (req, res) => {
  try {
    const prescription = await Prescription.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('patient', 'name patientId')
      .populate('doctor', 'name specialty');
    if (!prescription) return sendError(res, 'Prescription not found.', 404);
    sendSuccess(res, prescription, 'Prescription updated.');
  } catch (err) { sendError(res, err.message); }
});

module.exports = router;
