const express = require('express');
const router = express.Router();
const { MedicineReminder } = require('../models/Misc');
const { protect } = require('../middleware/auth');
const { sendSuccess, sendError } = require('../utils/apiHelpers');

// GET /api/reminders
router.get('/', protect, async (req, res) => {
  try {
    let patientId = req.query.patientId;
    if (req.user.role === 'patient') {
      patientId = req.user.linkedPatientId;
    }

    const filter = { isActive: true };
    if (patientId) filter.patient = patientId;

    const reminders = await MedicineReminder.find(filter)
      .populate('patient', 'firstName lastName patientId')
      .sort({ createdAt: -1 });

    sendSuccess(res, reminders);
  } catch (err) {
    sendError(res, err.message);
  }
});

// POST /api/reminders
router.post('/', protect, async (req, res) => {
  try {
    let patientId = req.body.patient || (req.user.role === 'patient' ? req.user.linkedPatientId : undefined);
    if (!patientId) return sendError(res, 'Patient ID required', 400);

    const reminder = await MedicineReminder.create({
      ...req.body,
      patient: patientId
    });

    sendSuccess(res, reminder, 'Medicine reminder created successfully.', 201);
  } catch (err) {
    sendError(res, err.message);
  }
});

// POST /api/reminders/:id/log - Record dose status (taken/skipped/missed)
router.post('/:id/log', protect, async (req, res) => {
  try {
    const { status, scheduledTime } = req.body;
    if (!['taken', 'skipped', 'missed'].includes(status)) {
      return sendError(res, 'Status must be taken, skipped, or missed.', 400);
    }

    const reminder = await MedicineReminder.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          history: {
            scheduledTime: scheduledTime ? new Date(scheduledTime) : new Date(),
            status,
            recordedAt: new Date()
          }
        }
      },
      { new: true }
    );

    if (!reminder) return sendError(res, 'Reminder not found.', 404);
    sendSuccess(res, reminder, `Dose marked as ${status}.`);
  } catch (err) {
    sendError(res, err.message);
  }
});

// PATCH /api/reminders/:id
router.patch('/:id', protect, async (req, res) => {
  try {
    const reminder = await MedicineReminder.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!reminder) return sendError(res, 'Reminder not found.', 404);
    sendSuccess(res, reminder, 'Reminder updated.');
  } catch (err) {
    sendError(res, err.message);
  }
});

// DELETE /api/reminders/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const reminder = await MedicineReminder.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!reminder) return sendError(res, 'Reminder not found.', 404);
    sendSuccess(res, null, 'Reminder deleted.');
  } catch (err) {
    sendError(res, err.message);
  }
});

module.exports = router;
