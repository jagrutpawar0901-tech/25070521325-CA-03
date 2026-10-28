const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const { Bed, Ward } = require('../models/Bed');
const { Invoice, Payment } = require('../models/Invoice');
const { Medicine, MedicineBatch } = require('../models/Medicine');
const EmergencyCase = require('../models/EmergencyCase');
const Appointment = require('../models/Appointment');
const Admission = require('../models/Admission');
const { protect, authorize } = require('../middleware/auth');
const { sendSuccess, sendError } = require('../utils/apiHelpers');

// GET /api/reports/summary - Executive overview
router.get('/summary', protect, authorize('admin', 'doctor', 'billing', 'receptionist', 'nurse'), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalPatients,
      totalBeds,
      occupiedBeds,
      activeAdmissions,
      todayAppointments,
      activeEmergencies,
      totalRevenueResult,
      unpaidInvoicesResult
    ] = await Promise.all([
      Patient.countDocuments({ isActive: true }),
      Bed.countDocuments(),
      Bed.countDocuments({ status: 'occupied' }),
      Admission.countDocuments({ status: 'active' }),
      Appointment.countDocuments({ scheduledDate: { $gte: today } }),
      EmergencyCase.countDocuments({ status: { $in: ['waiting', 'assessing', 'treating'] } }),
      Invoice.aggregate([{ $group: { _id: null, total: { $sum: '$paidAmount' } } }]),
      Invoice.aggregate([
        { $match: { status: { $in: ['issued', 'partially-paid'] } } },
        { $group: { _id: null, total: { $sum: '$outstandingAmount' } } }
      ])
    ]);

    const bedOccupancyRate = totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : 0;

    sendSuccess(res, {
      totalPatients,
      totalBeds,
      occupiedBeds,
      bedOccupancyRate: `${bedOccupancyRate}%`,
      activeAdmissions,
      todayAppointments,
      activeEmergencies,
      totalRevenue: totalRevenueResult[0]?.total || 0,
      outstandingRevenue: unpaidInvoicesResult[0]?.total || 0
    });
  } catch (err) {
    sendError(res, err.message);
  }
});

// GET /api/reports/occupancy - Bed & Ward Occupancy
router.get('/occupancy', protect, authorize('admin', 'doctor', 'nurse'), async (req, res) => {
  try {
    const [wardStats, bedStatusStats] = await Promise.all([
      Bed.aggregate([
        {
          $group: {
            _id: '$ward',
            total: { $sum: 1 },
            occupied: { $sum: { $cond: [{ $eq: ['$status', 'occupied'] }, 1, 0] } },
            available: { $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] } },
            maintenance: { $sum: { $cond: [{ $eq: ['$status', 'maintenance'] }, 1, 0] } }
          }
        },
        {
          $lookup: {
            from: 'wards',
            localField: '_id',
            foreignField: '_id',
            as: 'wardDetails'
          }
        },
        { $unwind: { path: '$wardDetails', preserveNullAndEmptyArrays: true } }
      ]),
      Bed.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    sendSuccess(res, { wardStats, bedStatusStats });
  } catch (err) {
    sendError(res, err.message);
  }
});

// GET /api/reports/revenue - Financial Analytics
router.get('/revenue', protect, authorize('admin', 'billing'), async (req, res) => {
  try {
    const [monthlyRevenue, paymentMethods, categoryBreakdown] = await Promise.all([
      Payment.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Payment.aggregate([
        { $group: { _id: '$method', total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Invoice.aggregate([
        { $unwind: '$items' },
        { $group: { _id: '$items.category', total: { $sum: '$items.total' }, count: { $sum: 1 } } }
      ])
    ]);

    sendSuccess(res, { monthlyRevenue, paymentMethods, categoryBreakdown });
  } catch (err) {
    sendError(res, err.message);
  }
});

// GET /api/reports/pharmacy - Inventory health
router.get('/pharmacy', protect, authorize('admin', 'pharmacist', 'doctor'), async (req, res) => {
  try {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const [lowStock, expiringSoon, topValued] = await Promise.all([
      Medicine.find({ $expr: { $lte: ['$currentStock', '$reorderLevel'] } }).select('name code currentStock reorderLevel unit'),
      MedicineBatch.find({ expiryDate: { $gte: today, $lte: thirtyDaysFromNow }, currentQuantity: { $gt: 0 } })
        .populate('medicine', 'name code unit')
        .sort({ expiryDate: 1 }),
      Medicine.find().sort({ currentStock: -1 }).limit(10).select('name unit currentStock sellingPrice')
    ]);

    sendSuccess(res, { lowStock, expiringSoon, topValued });
  } catch (err) {
    sendError(res, err.message);
  }
});

// GET /api/reports/emergencies - Emergency triage metrics
router.get('/emergencies', protect, authorize('admin', 'doctor', 'nurse'), async (req, res) => {
  try {
    const [severityStats, statusStats] = await Promise.all([
      EmergencyCase.aggregate([
        { $group: { _id: '$triageSeverity', count: { $sum: 1 } } }
      ]),
      EmergencyCase.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ]);

    sendSuccess(res, { severityStats, statusStats });
  } catch (err) {
    sendError(res, err.message);
  }
});

module.exports = router;
