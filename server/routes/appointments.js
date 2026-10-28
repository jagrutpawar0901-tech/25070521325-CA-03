const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const { protect, authorize } = require('../middleware/auth');
const { sendSuccess, sendError, paginate, paginatedResponse } = require('../utils/apiHelpers');
const { Notification } = require('../models/Misc');

router.get('/', protect, async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const filter = {};

    if (req.user.role === 'patient' && req.user.linkedPatientId) {
      filter.patient = req.user.linkedPatientId;
    } else if (req.user.role === 'doctor' && req.user.linkedDoctorId) {
      filter.doctor = req.user.linkedDoctorId;
    }

    if (req.query.status) filter.status = req.query.status;
    if (req.query.doctor) filter.doctor = req.query.doctor;
    if (req.query.patient) filter.patient = req.query.patient;
    if (req.query.date) {
      const d = new Date(req.query.date);
      const start = new Date(d); start.setHours(0, 0, 0, 0);
      const end = new Date(d); end.setHours(23, 59, 59, 999);
      filter.scheduledDate = { $gte: start, $lte: end };
    }
    if (req.query.from && req.query.to) {
      filter.scheduledDate = { $gte: new Date(req.query.from), $lte: new Date(req.query.to) };
    }

    const [appts, total] = await Promise.all([
      Appointment.find(filter)
        .populate('patient', 'name patientId phone')
        .populate('doctor', 'name specialty consultationFee')
        .populate('department', 'name')
        .sort({ scheduledDate: -1, scheduledTime: -1 })
        .skip(skip).limit(limit),
      Appointment.countDocuments(filter)
    ]);
    paginatedResponse(res, appts, total, page, limit);
  } catch (err) {
    sendError(res, err.message);
  }
});

router.post('/', protect, authorize('admin', 'receptionist', 'doctor', 'patient'), async (req, res) => {
  try {
    const { patient, doctor, scheduledDate, scheduledTime, type, reason } = req.body;

    // Conflict check: doctor already has appointment at same date+time
    const conflict = await Appointment.findOne({
      doctor,
      scheduledDate: { $gte: new Date(new Date(scheduledDate).setHours(0,0,0,0)),
                       $lte: new Date(new Date(scheduledDate).setHours(23,59,59,999)) },
      scheduledTime,
      status: { $nin: ['cancelled', 'no-show'] }
    });
    if (conflict) {
      return sendError(res, 'This time slot is already booked for the selected doctor.', 409);
    }

    const doctorDoc = await Doctor.findById(doctor);
    const appt = await Appointment.create({
      ...req.body,
      consultationFee: doctorDoc?.consultationFee,
      createdBy: req.user._id
    });

    await appt.populate(['patient', 'doctor', 'department']);

    // Create notification for doctor
    if (doctorDoc?.linkedUserId) {
      await Notification.create({
        recipient: doctorDoc.linkedUserId,
        title: 'New Appointment Booked',
        message: `New ${type || 'consultation'} appointment scheduled for ${new Date(scheduledDate).toLocaleDateString('en-IN')} at ${scheduledTime}`,
        type: 'appointment',
        relatedId: appt._id,
        relatedModel: 'Appointment',
        link: `/appointments/${appt._id}`
      }).catch(() => {});
    }

    sendSuccess(res, appt, 'Appointment booked successfully.', 201);
  } catch (err) {
    sendError(res, err.message);
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id)
      .populate('patient', 'name patientId phone bloodGroup allergies')
      .populate('doctor', 'name specialty consultationFee workingHours')
      .populate('department', 'name');
    if (!appt) return sendError(res, 'Appointment not found.', 404);
    sendSuccess(res, appt);
  } catch (err) {
    sendError(res, err.message);
  }
});

router.patch('/:id', protect, authorize('admin', 'receptionist', 'doctor', 'nurse'), async (req, res) => {
  try {
    const appt = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('patient', 'name patientId')
      .populate('doctor', 'name specialty');
    if (!appt) return sendError(res, 'Appointment not found.', 404);
    sendSuccess(res, appt, 'Appointment updated.');
  } catch (err) {
    sendError(res, err.message);
  }
});

// PATCH /api/appointments/:id/cancel
router.patch('/:id/cancel', protect, async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id);
    if (!appt) return sendError(res, 'Appointment not found.', 404);

    // Patients can cancel their own; staff can cancel any
    if (req.user.role === 'patient') {
      if (req.user.linkedPatientId?.toString() !== appt.patient.toString()) {
        return sendError(res, 'Access denied.', 403);
      }
    }

    appt.status = 'cancelled';
    appt.cancellationReason = req.body.reason || 'Cancelled by user';
    appt.cancelledAt = new Date();
    await appt.save();
    sendSuccess(res, appt, 'Appointment cancelled.');
  } catch (err) {
    sendError(res, err.message);
  }
});

// PATCH /api/appointments/:id/checkin
router.patch('/:id/checkin', protect, authorize('admin', 'receptionist', 'nurse'), async (req, res) => {
  try {
    const appt = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: 'checked-in', checkedInAt: new Date() },
      { new: true }
    );
    if (!appt) return sendError(res, 'Appointment not found.', 404);
    sendSuccess(res, appt, 'Patient checked in.');
  } catch (err) {
    sendError(res, err.message);
  }
});

// GET /api/appointments/today
router.get('/today/list', protect, async (req, res) => {
  try {
    const today = new Date();
    const start = new Date(today); start.setHours(0, 0, 0, 0);
    const end = new Date(today); end.setHours(23, 59, 59, 999);

    const filter = { scheduledDate: { $gte: start, $lte: end } };
    if (req.user.role === 'doctor' && req.user.linkedDoctorId) {
      filter.doctor = req.user.linkedDoctorId;
    }

    const appointments = await Appointment.find(filter)
      .populate('patient', 'name patientId phone')
      .populate('doctor', 'name specialty')
      .sort({ scheduledTime: 1 });
    sendSuccess(res, appointments);
  } catch (err) {
    sendError(res, err.message);
  }
});

module.exports = router;
