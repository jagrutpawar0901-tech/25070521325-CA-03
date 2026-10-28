const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Admission = require('../models/Admission');
const { Bed } = require('../models/Bed');
const { Ambulance } = require('../models/Ambulance');
const EmergencyCase = require('../models/EmergencyCase');
const { Invoice } = require('../models/Invoice');
const { Medicine } = require('../models/Medicine');
const { protect } = require('../middleware/auth');
const { sendSuccess, sendError } = require('../utils/apiHelpers');

router.get('/stats', protect, async (req, res) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalPatients,
      todayAppointments,
      activeAdmissions,
      bedStats,
      availableAmbulances,
      activeEmergencies,
      pendingInvoices,
      todayCollections,
      monthlyRevenue,
      lowStockMedicines
    ] = await Promise.all([
      Patient.countDocuments({ isActive: true }),
      Appointment.countDocuments({ scheduledDate: { $gte: today, $lt: tomorrow }, status: { $nin: ['cancelled', 'no-show'] } }),
      Admission.countDocuments({ status: 'active' }),
      Bed.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Ambulance.countDocuments({ status: 'available' }),
      EmergencyCase.countDocuments({ status: { $in: ['waiting', 'assessing', 'treating'] } }),
      Invoice.countDocuments({ status: { $in: ['issued', 'partially-paid'] } }),
      Invoice.aggregate([
        { $match: { createdAt: { $gte: today, $lt: tomorrow }, status: { $in: ['paid', 'partially-paid'] } } },
        { $group: { _id: null, total: { $sum: '$paidAmount' } } }
      ]),
      Invoice.aggregate([
        { $match: { createdAt: { $gte: monthStart }, status: { $in: ['paid', 'partially-paid'] } } },
        { $group: { _id: null, total: { $sum: '$paidAmount' } } }
      ]),
      Medicine.countDocuments({ isActive: true, $expr: { $lte: ['$totalStock', '$reorderLevel'] } })
    ]);

    const bedSummary = { available: 0, occupied: 0, total: 0 };
    bedStats.forEach(b => {
      bedSummary[b._id] = b.count;
      bedSummary.total += b.count;
    });

    sendSuccess(res, {
      totalPatients,
      todayAppointments,
      activeAdmissions,
      beds: bedSummary,
      availableAmbulances,
      activeEmergencies,
      pendingInvoices,
      todayCollections: todayCollections[0]?.total || 0,
      monthlyRevenue: monthlyRevenue[0]?.total || 0,
      lowStockMedicines
    });
  } catch (err) {
    sendError(res, err.message);
  }
});

// Charts data
router.get('/charts', protect, async (req, res) => {
  try {
    const today = new Date();
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(today.getMonth() - 6);

    // Monthly admissions
    const admissionsChart = await Admission.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Monthly revenue
    const revenueChart = await Invoice.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo }, status: { $in: ['paid', 'partially-paid'] } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, revenue: { $sum: '$paidAmount' } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Appointment status
    const appointmentStats = await Appointment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Emergency trend
    const emergencyChart = await EmergencyCase.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, priority: '$triagePriority' }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    sendSuccess(res, { admissionsChart, revenueChart, appointmentStats, emergencyChart });
  } catch (err) {
    sendError(res, err.message);
  }
});

// Recent activity
router.get('/recent', protect, async (req, res) => {
  try {
    const [recentPatients, upcomingAppointments, recentAdmissions] = await Promise.all([
      Patient.find({ isActive: true }).sort({ createdAt: -1 }).limit(5).select('name patientId bloodGroup phone createdAt'),
      Appointment.find({ scheduledDate: { $gte: new Date() }, status: { $nin: ['cancelled', 'no-show', 'completed'] } })
        .populate('patient', 'name patientId')
        .populate('doctor', 'name specialty')
        .sort({ scheduledDate: 1, scheduledTime: 1 })
        .limit(5),
      Admission.find({ status: 'active' })
        .populate('patient', 'name patientId bloodGroup')
        .populate('doctor', 'name specialty')
        .populate('bed', 'bedNumber')
        .sort({ admissionDate: -1 })
        .limit(5)
    ]);

    sendSuccess(res, { recentPatients, upcomingAppointments, recentAdmissions });
  } catch (err) {
    sendError(res, err.message);
  }
});

module.exports = router;
