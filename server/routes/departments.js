const express = require('express');
const router = express.Router();
const Department = require('../models/Department');
const { protect, authorize } = require('../middleware/auth');
const { sendSuccess, sendError } = require('../utils/apiHelpers');

// GET /api/departments - list active departments
router.get('/', async (req, res) => {
  try {
    const filter = req.query.all === 'true' ? {} : { isActive: true };
    const departments = await Department.find(filter)
      .populate('head', 'name specialization qualifications')
      .sort({ name: 1 });
    sendSuccess(res, departments);
  } catch (err) {
    sendError(res, err.message);
  }
});

// GET /api/departments/:id
router.get('/:id', async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('head', 'name specialization qualifications contactNumber email');
    if (!department) return sendError(res, 'Department not found.', 404);
    sendSuccess(res, department);
  } catch (err) {
    sendError(res, err.message);
  }
});

// POST /api/departments (Admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const department = await Department.create(req.body);
    sendSuccess(res, department, 'Department created successfully.', 201);
  } catch (err) {
    if (err.code === 11000) return sendError(res, 'A department with this name or code already exists.', 409);
    sendError(res, err.message);
  }
});

// PATCH /api/departments/:id (Admin only)
router.patch('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!department) return sendError(res, 'Department not found.', 404);
    sendSuccess(res, department, 'Department updated.');
  } catch (err) {
    sendError(res, err.message);
  }
});

// DELETE /api/departments/:id (Soft delete, Admin only)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!department) return sendError(res, 'Department not found.', 404);
    sendSuccess(res, null, 'Department deactivated.');
  } catch (err) {
    sendError(res, err.message);
  }
});

module.exports = router;
