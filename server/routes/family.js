const express = require('express');
const router = express.Router();
const { FamilyRelationship } = require('../models/Misc');
const Patient = require('../models/Patient');
const { protect } = require('../middleware/auth');
const { sendSuccess, sendError } = require('../utils/apiHelpers');

// GET /api/family - get family members linked to current patient or query patient
router.get('/', protect, async (req, res) => {
  try {
    let patientId = req.query.patientId;
    if (req.user.role === 'patient') {
      patientId = req.user.linkedPatientId;
    }
    if (!patientId) {
      return sendError(res, 'Patient ID required', 400);
    }

    const relations = await FamilyRelationship.find({
      $or: [{ primaryPatient: patientId }, { relatedPatient: patientId }],
      isActive: true
    })
      .populate('primaryPatient', 'firstName lastName patientId phone bloodGroup dateOfBirth')
      .populate('relatedPatient', 'firstName lastName patientId phone bloodGroup dateOfBirth');

    sendSuccess(res, relations);
  } catch (err) {
    sendError(res, err.message);
  }
});

// POST /api/family - add family relationship
router.post('/', protect, async (req, res) => {
  try {
    const { primaryPatient, relatedPatient, relationship, accessLevel, consentGiven } = req.body;
    
    // Check if target patient exists
    const [p1, p2] = await Promise.all([
      Patient.findById(primaryPatient),
      Patient.findById(relatedPatient)
    ]);
    if (!p1 || !p2) return sendError(res, 'One or both patients not found.', 404);

    const relation = await FamilyRelationship.create({
      primaryPatient,
      relatedPatient,
      relationship,
      accessLevel: accessLevel || 'view',
      consentGiven: Boolean(consentGiven),
      consentDate: consentGiven ? new Date() : undefined
    });

    sendSuccess(res, relation, 'Family relationship added successfully.', 201);
  } catch (err) {
    sendError(res, err.message);
  }
});

// PATCH /api/family/:id - update consent or access
router.patch('/:id', protect, async (req, res) => {
  try {
    const relation = await FamilyRelationship.findByIdAndUpdate(
      req.params.id,
      { ...req.body, consentDate: req.body.consentGiven ? new Date() : undefined },
      { new: true }
    );
    if (!relation) return sendError(res, 'Relationship not found.', 404);
    sendSuccess(res, relation, 'Relationship updated.');
  } catch (err) {
    sendError(res, err.message);
  }
});

// DELETE /api/family/:id - unlink family relationship
router.delete('/:id', protect, async (req, res) => {
  try {
    const relation = await FamilyRelationship.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!relation) return sendError(res, 'Relationship not found.', 404);
    sendSuccess(res, null, 'Family relationship unlinked.');
  } catch (err) {
    sendError(res, err.message);
  }
});

module.exports = router;
