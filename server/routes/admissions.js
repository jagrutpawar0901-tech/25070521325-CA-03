const express = require('express');
const router = express.Router();
const Admission = require('../models/Admission');
const { Bed } = require('../models/Bed');
const { protect, authorize } = require('../middleware/auth');
const { sendSuccess, sendError, paginate, paginatedResponse } = require('../utils/apiHelpers');
const { Notification } = require('../models/Misc');
const mongoose = require('mongoose');

router.get('/', protect, authorize('admin', 'doctor', 'receptionist', 'nurse', 'billing'), async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.patient) filter.patient = req.query.patient;
    if (req.query.doctor) filter.doctor = req.query.doctor;

    const [admissions, total] = await Promise.all([
      Admission.find(filter)
        .populate('patient', 'name patientId phone bloodGroup')
        .populate('doctor', 'name specialty')
        .populate('bed', 'bedNumber type')
        .populate('room', 'roomNumber ratePerDay')
        .populate('ward', 'name type')
        .sort({ admissionDate: -1 })
        .skip(skip).limit(limit),
      Admission.countDocuments(filter)
    ]);
    paginatedResponse(res, admissions, total, page, limit);
  } catch (err) {
    sendError(res, err.message);
  }
});

router.post('/', protect, authorize('admin', 'receptionist', 'doctor'), async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { patient, doctor, bed, room, ward, diagnosis, admissionType, notes, emergencyCase } = req.body;

    // Check bed availability atomically
    if (bed) {
      const bedDoc = await Bed.findOneAndUpdate(
        { _id: bed, status: 'available' },
        { status: 'occupied', currentPatient: patient },
        { new: true, session }
      );
      if (!bedDoc) {
        await session.abortTransaction();
        return sendError(res, 'Selected bed is not available. Please choose another.', 409);
      }
    }

    const admission = new Admission({
      patient, doctor, bed, room, ward, diagnosis, admissionType, notes, emergencyCase,
      admissionDate: new Date(),
      createdBy: req.user._id
    });
    await admission.save({ session });

    if (bed) {
      await Bed.findByIdAndUpdate(bed, { currentAdmission: admission._id }, { session });
    }

    await session.commitTransaction();
    await admission.populate(['patient', 'doctor', 'bed', 'room', 'ward']);
    sendSuccess(res, admission, 'Patient admitted successfully.', 201);
  } catch (err) {
    await session.abortTransaction();
    sendError(res, err.message);
  } finally {
    session.endSession();
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const admission = await Admission.findById(req.params.id)
      .populate('patient', 'name patientId phone bloodGroup allergies medicalHistory')
      .populate('doctor', 'name specialty consultationFee')
      .populate('bed', 'bedNumber type')
      .populate('room', 'roomNumber ratePerDay type')
      .populate('ward', 'name type');
    if (!admission) return sendError(res, 'Admission not found.', 404);
    sendSuccess(res, admission);
  } catch (err) {
    sendError(res, err.message);
  }
});

router.patch('/:id', protect, authorize('admin', 'doctor', 'nurse', 'receptionist'), async (req, res) => {
  try {
    const admission = await Admission.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('patient', 'name patientId')
      .populate('doctor', 'name');
    if (!admission) return sendError(res, 'Admission not found.', 404);
    sendSuccess(res, admission, 'Admission updated.');
  } catch (err) {
    sendError(res, err.message);
  }
});

// POST /api/admissions/:id/discharge
router.post('/:id/discharge', protect, authorize('admin', 'doctor', 'receptionist'), async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const admission = await Admission.findById(req.params.id).session(session);
    if (!admission) {
      await session.abortTransaction();
      return sendError(res, 'Admission not found.', 404);
    }
    if (admission.status !== 'active') {
      await session.abortTransaction();
      return sendError(res, 'Admission is not active.', 400);
    }

    admission.status = 'discharged';
    admission.dischargeDate = new Date();
    if (req.body.notes) admission.notes = req.body.notes;
    await admission.save({ session });

    // Release bed atomically
    if (admission.bed) {
      await Bed.findByIdAndUpdate(admission.bed, {
        status: 'cleaning',
        currentPatient: null,
        currentAdmission: null,
        lastCleanedAt: new Date()
      }, { session });
    }

    await session.commitTransaction();
    sendSuccess(res, admission, 'Patient discharged. Bed released for cleaning.');
  } catch (err) {
    await session.abortTransaction();
    sendError(res, err.message);
  } finally {
    session.endSession();
  }
});

module.exports = router;
