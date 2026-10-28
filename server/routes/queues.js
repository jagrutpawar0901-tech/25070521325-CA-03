const express = require('express');
const router = express.Router();
const { QueueToken } = require('../models/Misc');
const Appointment = require('../models/Appointment');
const { protect, authorize } = require('../middleware/auth');
const { sendSuccess, sendError } = require('../utils/apiHelpers');

// GET /api/queues/display - Public live queue board (no auth needed for waiting room TVs!)
router.get('/display', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tokens = await QueueToken.find({
      date: { $gte: today, $lt: tomorrow },
      status: { $in: ['waiting', 'called', 'serving'] }
    })
      .populate('doctor', 'name specialty')
      .populate('department', 'name floor')
      .populate('patient', 'name patientId')
      .sort({ position: 1, createdAt: 1 });

    sendSuccess(res, tokens);
  } catch (err) {
    sendError(res, err.message);
  }
});

// GET /api/queues - List today's tokens with filters
router.get('/', protect, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const filter = {
      date: { $gte: today, $lt: tomorrow }
    };

    if (req.query.doctor) filter.doctor = req.query.doctor;
    if (req.query.department) filter.department = req.query.department;
    if (req.query.status) filter.status = req.query.status;

    // Doctor can only see their queue
    if (req.user.role === 'doctor' && req.user.linkedDoctorId) {
      filter.doctor = req.user.linkedDoctorId;
    }

    const tokens = await QueueToken.find(filter)
      .populate('patient', 'name patientId phone')
      .populate('doctor', 'name specialty')
      .populate('department', 'name')
      .sort({ position: 1, createdAt: 1 });

    sendSuccess(res, tokens);
  } catch (err) {
    sendError(res, err.message);
  }
});

// POST /api/queues/checkin - Check-in for an appointment or walk-in
router.post('/checkin', protect, async (req, res) => {
  try {
    const { patientId, appointmentId, doctorId, departmentId, isWalkIn } = req.body;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Calculate queue position for the doctor/department today
    const currentCount = await QueueToken.countDocuments({
      date: { $gte: today, $lt: tomorrow },
      ...(doctorId ? { doctor: doctorId } : {})
    });

    const token = await QueueToken.create({
      patient: patientId || (req.user.role === 'patient' ? req.user.linkedPatientId : undefined),
      appointment: appointmentId,
      doctor: doctorId,
      department: departmentId,
      date: new Date(),
      position: currentCount + 1,
      estimatedWaitMinutes: (currentCount) * 15, // 15 mins per patient avg
      isWalkIn: Boolean(isWalkIn),
      status: 'waiting'
    });

    // If linked to appointment, update appointment status to checked-in
    if (appointmentId) {
      await Appointment.findByIdAndUpdate(appointmentId, { status: 'confirmed' });
    }

    const populatedToken = await QueueToken.findById(token._id)
      .populate('patient', 'firstName lastName patientId')
      .populate('doctor', 'name specialization roomNumber')
      .populate('department', 'name');

    sendSuccess(res, populatedToken, `Token ${token.tokenNumber} issued successfully.`, 201);
  } catch (err) {
    sendError(res, err.message);
  }
});

// PATCH /api/queues/:id/call - Call token
router.patch('/:id/call', protect, authorize('doctor', 'nurse', 'receptionist', 'admin'), async (req, res) => {
  try {
    const token = await QueueToken.findByIdAndUpdate(
      req.params.id,
      { status: 'called', calledAt: new Date() },
      { new: true }
    ).populate('patient', 'firstName lastName phone');

    if (!token) return sendError(res, 'Queue token not found.', 404);
    sendSuccess(res, token, `Token ${token.tokenNumber} called.`);
  } catch (err) {
    sendError(res, err.message);
  }
});

// PATCH /api/queues/:id/serve - Serving/Complete token
router.patch('/:id/serve', protect, authorize('doctor', 'admin'), async (req, res) => {
  try {
    const token = await QueueToken.findByIdAndUpdate(
      req.params.id,
      { status: 'served', servedAt: new Date() },
      { new: true }
    );
    if (!token) return sendError(res, 'Queue token not found.', 404);
    sendSuccess(res, token, `Token ${token.tokenNumber} marked as served.`);
  } catch (err) {
    sendError(res, err.message);
  }
});

// PATCH /api/queues/:id/skip - Skip token
router.patch('/:id/skip', protect, authorize('doctor', 'nurse', 'receptionist', 'admin'), async (req, res) => {
  try {
    const token = await QueueToken.findByIdAndUpdate(
      req.params.id,
      { status: 'skipped' },
      { new: true }
    );
    if (!token) return sendError(res, 'Queue token not found.', 404);
    sendSuccess(res, token, `Token ${token.tokenNumber} skipped.`);
  } catch (err) {
    sendError(res, err.message);
  }
});

module.exports = router;
