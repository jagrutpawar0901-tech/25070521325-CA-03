const express = require('express');
const router = express.Router();
const { Ambulance, AmbulanceTrip } = require('../models/Ambulance');
const { protect, authorize } = require('../middleware/auth');
const { sendSuccess, sendError, paginate, paginatedResponse } = require('../utils/apiHelpers');
const mongoose = require('mongoose');

// GET all ambulances
router.get('/', protect, async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const ambulances = await Ambulance.find(filter).sort({ vehicleId: 1 });
    sendSuccess(res, ambulances);
  } catch (err) { sendError(res, err.message); }
});

router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const ambulance = await Ambulance.create(req.body);
    sendSuccess(res, ambulance, 'Ambulance registered.', 201);
  } catch (err) { sendError(res, err.message); }
});

router.patch('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const ambulance = await Ambulance.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!ambulance) return sendError(res, 'Ambulance not found.', 404);
    sendSuccess(res, ambulance, 'Ambulance updated.');
  } catch (err) { sendError(res, err.message); }
});

// POST /api/ambulances/:id/dispatch — Dispatch an ambulance
router.post('/:id/dispatch', protect, authorize('admin', 'receptionist', 'nurse'), async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const ambulance = await Ambulance.findOneAndUpdate(
      { _id: req.params.id, status: 'available' },
      { status: 'dispatched' },
      { new: true, session }
    );
    if (!ambulance) {
      await session.abortTransaction();
      return sendError(res, 'Ambulance is not available for dispatch.', 409);
    }

    const trip = await AmbulanceTrip.create([{
      ambulance: ambulance._id,
      emergencyCase: req.body.emergencyCase,
      patient: req.body.patient,
      dispatcher: req.user._id,
      pickupLocation: req.body.pickupLocation,
      destinationLocation: req.body.destinationLocation || { address: 'SwasthyaOS Hospital' },
      notes: req.body.notes
    }], { session });

    await session.commitTransaction();
    sendSuccess(res, { ambulance, trip: trip[0] }, 'Ambulance dispatched. (Location data is simulated for demo purposes)', 201);
  } catch (err) {
    await session.abortTransaction();
    sendError(res, err.message);
  } finally {
    session.endSession();
  }
});

// POST /api/ambulances/trips/:tripId/complete
router.post('/trips/:tripId/complete', protect, authorize('admin', 'receptionist'), async (req, res) => {
  try {
    const trip = await AmbulanceTrip.findById(req.params.tripId);
    if (!trip) return sendError(res, 'Trip not found.', 404);

    trip.status = 'completed';
    trip.completedAt = new Date();
    await trip.save();

    // Release ambulance
    await Ambulance.findByIdAndUpdate(trip.ambulance, { status: 'available' });
    sendSuccess(res, trip, 'Trip completed. Ambulance is now available.');
  } catch (err) {
    sendError(res, err.message);
  }
});

// GET trips
router.get('/trips/all', protect, async (req, res) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const [trips, total] = await Promise.all([
      AmbulanceTrip.find()
        .populate('ambulance', 'vehicleId registrationNumber type')
        .populate('patient', 'name patientId')
        .populate('dispatcher', 'name')
        .sort({ createdAt: -1 })
        .skip(skip).limit(limit),
      AmbulanceTrip.countDocuments()
    ]);
    paginatedResponse(res, trips, total, page, limit);
  } catch (err) {
    sendError(res, err.message);
  }
});

module.exports = router;
