const express = require('express');
const router = express.Router();
const { Consultation } = require('../models/Misc');
const { protect } = require('../middleware/auth');
const { sendSuccess, sendError, paginate, paginatedResponse } = require('../utils/apiHelpers');

// GET /api/consultations
router.get('/', protect, async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const filter = {};

    if (req.user.role === 'patient') {
      filter.patient = req.user.linkedPatientId;
    } else if (req.user.role === 'doctor') {
      filter.doctor = req.user.linkedDoctorId;
    }

    if (req.query.status) filter.status = req.query.status;

    const [consultations, total] = await Promise.all([
      Consultation.find(filter)
        .populate('patient', 'firstName lastName patientId phone')
        .populate('doctor', 'name specialization qualifications')
        .sort({ scheduledAt: -1 })
        .skip(skip)
        .limit(limit),
      Consultation.countDocuments(filter)
    ]);

    paginatedResponse(res, consultations, total, page, limit);
  } catch (err) {
    sendError(res, err.message);
  }
});

// GET /api/consultations/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id)
      .populate('patient', 'firstName lastName patientId phone dateOfBirth bloodGroup allergies')
      .populate('doctor', 'name specialization qualifications roomNumber')
      .populate('messages.sender', 'name role');

    if (!consultation) return sendError(res, 'Consultation not found.', 404);
    sendSuccess(res, consultation);
  } catch (err) {
    sendError(res, err.message);
  }
});

// POST /api/consultations
router.post('/', protect, async (req, res) => {
  try {
    const { patient, doctor, appointment, scheduledAt, notes } = req.body;
    const sessionUrl = `https://meet.jit.si/swasthyaos-${Date.now()}`;

    const consultation = await Consultation.create({
      patient: patient || req.user.linkedPatientId,
      doctor: doctor || req.user.linkedDoctorId,
      appointment,
      scheduledAt: scheduledAt || new Date(),
      sessionUrl,
      notes,
      status: 'scheduled'
    });

    const populated = await Consultation.findById(consultation._id)
      .populate('patient', 'firstName lastName patientId')
      .populate('doctor', 'name specialization');

    sendSuccess(res, populated, 'Consultation scheduled successfully.', 201);
  } catch (err) {
    sendError(res, err.message);
  }
});

// POST /api/consultations/:id/messages
router.post('/:id/messages', protect, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) return sendError(res, 'Message content cannot be empty.', 400);

    const consultation = await Consultation.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          messages: {
            sender: req.user._id,
            content: content.trim(),
            sentAt: new Date(),
            isRead: false
          }
        }
      },
      { new: true }
    ).populate('messages.sender', 'name role');

    if (!consultation) return sendError(res, 'Consultation not found.', 404);
    sendSuccess(res, consultation.messages[consultation.messages.length - 1], 'Message sent.');
  } catch (err) {
    sendError(res, err.message);
  }
});

// PATCH /api/consultations/:id
router.patch('/:id', protect, async (req, res) => {
  try {
    const update = { ...req.body };
    if (update.status === 'in-progress' && !update.startedAt) {
      update.startedAt = new Date();
    }
    if (update.status === 'completed' && !update.endedAt) {
      update.endedAt = new Date();
    }

    const consultation = await Consultation.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('patient', 'firstName lastName')
      .populate('doctor', 'name specialization');

    if (!consultation) return sendError(res, 'Consultation not found.', 404);
    sendSuccess(res, consultation, 'Consultation updated.');
  } catch (err) {
    sendError(res, err.message);
  }
});

module.exports = router;
