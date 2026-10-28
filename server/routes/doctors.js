const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const { protect, authorize } = require('../middleware/auth');
const { sendSuccess, sendError, paginate, paginatedResponse } = require('../utils/apiHelpers');

router.get('/', protect, async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const filter = {};
    if (req.query.specialty) filter.specialty = { $regex: req.query.specialty, $options: 'i' };
    if (req.query.department) filter.department = req.query.department;
    if (req.query.isAvailable) filter.isAvailable = req.query.isAvailable === 'true';
    if (req.query.search) filter.$text = { $search: req.query.search };

    const [doctors, total] = await Promise.all([
      Doctor.find(filter).populate('department', 'name').sort({ name: 1 }).skip(skip).limit(limit),
      Doctor.countDocuments(filter)
    ]);
    paginatedResponse(res, doctors, total, page, limit);
  } catch (err) {
    sendError(res, err.message);
  }
});

router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const doctor = await Doctor.create(req.body);
    sendSuccess(res, doctor, 'Doctor added successfully.', 201);
  } catch (err) {
    sendError(res, err.message);
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate('department', 'name');
    if (!doctor) return sendError(res, 'Doctor not found.', 404);
    sendSuccess(res, doctor);
  } catch (err) {
    sendError(res, err.message);
  }
});

router.patch('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    delete req.body.doctorId;
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!doctor) return sendError(res, 'Doctor not found.', 404);
    sendSuccess(res, doctor, 'Doctor updated.');
  } catch (err) {
    sendError(res, err.message);
  }
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await Doctor.findByIdAndDelete(req.params.id);
    sendSuccess(res, null, 'Doctor removed.');
  } catch (err) {
    sendError(res, err.message);
  }
});

// GET /api/doctors/:id/availability?date=YYYY-MM-DD
router.get('/:id/availability', protect, async (req, res) => {
  try {
    const Appointment = require('../models/Appointment');
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return sendError(res, 'Doctor not found.', 404);

    const date = req.query.date ? new Date(req.query.date) : new Date();
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

    if (!doctor.workingDays.includes(dayName)) {
      return sendSuccess(res, { available: false, slots: [], reason: `Doctor does not work on ${dayName}` });
    }

    // Generate slots
    const slots = [];
    const [startH, startM] = doctor.workingHours.start.split(':').map(Number);
    const [endH, endM] = doctor.workingHours.end.split(':').map(Number);
    let current = startH * 60 + startM;
    const end = endH * 60 + endM;
    const duration = doctor.appointmentDuration || 15;

    while (current + duration <= end) {
      const h = Math.floor(current / 60).toString().padStart(2, '0');
      const m = (current % 60).toString().padStart(2, '0');
      slots.push(`${h}:${m}`);
      current += duration;
    }

    // Find booked slots
    const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999);
    const booked = await Appointment.find({
      doctor: req.params.id,
      scheduledDate: { $gte: dayStart, $lte: dayEnd },
      status: { $nin: ['cancelled', 'no-show'] }
    }).select('scheduledTime');

    const bookedTimes = booked.map(a => a.scheduledTime);
    const available = slots.filter(s => !bookedTimes.includes(s));

    sendSuccess(res, { available: true, slots, bookedTimes, availableSlots: available, doctor: doctor.name });
  } catch (err) {
    sendError(res, err.message);
  }
});

module.exports = router;
