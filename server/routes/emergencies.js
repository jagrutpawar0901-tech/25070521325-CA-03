const express = require('express');
const router = express.Router();
const EmergencyCase = require('../models/EmergencyCase');
const { Ambulance } = require('../models/Ambulance');
const { protect, authorize } = require('../middleware/auth');
const { sendSuccess, sendError, paginate, paginatedResponse } = require('../utils/apiHelpers');

router.get('/', protect, authorize('admin', 'doctor', 'nurse', 'receptionist'), async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.triagePriority = req.query.priority;

    const [cases, total] = await Promise.all([
      EmergencyCase.find(filter)
        .populate('patient', 'name patientId phone bloodGroup')
        .populate('assignedDoctor', 'name specialty')
        .populate('assignedNurse', 'name')
        .populate('ambulance', 'vehicleId registrationNumber')
        .sort({ arrivalTime: -1 })
        .skip(skip).limit(limit),
      EmergencyCase.countDocuments(filter)
    ]);
    paginatedResponse(res, cases, total, page, limit);
  } catch (err) {
    sendError(res, err.message);
  }
});

router.post('/', protect, authorize('admin', 'doctor', 'nurse', 'receptionist'), async (req, res) => {
  try {
    const emergencyCase = await EmergencyCase.create({
      ...req.body,
      createdBy: req.user._id,
      eventHistory: [{
        event: 'Emergency case registered',
        by: req.user._id,
        notes: req.body.complaint
      }]
    });
    await emergencyCase.populate(['patient', 'assignedDoctor', 'ambulance']);
    sendSuccess(res, emergencyCase, 'Emergency case registered.', 201);
  } catch (err) {
    sendError(res, err.message);
  }
});

router.get('/:id', protect, authorize('admin', 'doctor', 'nurse'), async (req, res) => {
  try {
    const emergencyCase = await EmergencyCase.findById(req.params.id)
      .populate('patient', 'name patientId phone bloodGroup allergies')
      .populate('assignedDoctor', 'name specialty')
      .populate('assignedNurse', 'name')
      .populate('ambulance', 'vehicleId registrationNumber driver')
      .populate('eventHistory.by', 'name role');
    if (!emergencyCase) return sendError(res, 'Emergency case not found.', 404);
    sendSuccess(res, emergencyCase);
  } catch (err) {
    sendError(res, err.message);
  }
});

router.patch('/:id', protect, authorize('admin', 'doctor', 'nurse', 'receptionist'), async (req, res) => {
  try {
    const emergencyCase = await EmergencyCase.findById(req.params.id);
    if (!emergencyCase) return sendError(res, 'Emergency case not found.', 404);

    // Add event if status changed
    if (req.body.status && req.body.status !== emergencyCase.status) {
      emergencyCase.eventHistory.push({
        event: `Status changed to ${req.body.status}`,
        by: req.user._id,
        notes: req.body.eventNote || ''
      });
    }

    Object.assign(emergencyCase, req.body);
    await emergencyCase.save();
    await emergencyCase.populate(['patient', 'assignedDoctor']);
    sendSuccess(res, emergencyCase, 'Emergency case updated.');
  } catch (err) {
    sendError(res, err.message);
  }
});

module.exports = router;
