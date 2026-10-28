const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  appointmentId: { type: String, unique: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  scheduledDate: { type: Date, required: true },
  scheduledTime: { type: String, required: true }, // "HH:MM"
  duration: { type: Number, default: 15 }, // minutes
  type: { type: String, enum: ['consultation', 'follow-up', 'emergency', 'online', 'walk-in'], default: 'consultation' },
  status: {
    type: String,
    enum: ['requested', 'scheduled', 'confirmed', 'checked-in', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  reason: { type: String },
  notes: { type: String },
  consultationFee: { type: Number },
  queueToken: { type: String },
  checkedInAt: { type: Date },
  completedAt: { type: Date },
  cancelledAt: { type: Date },
  cancellationReason: { type: String },
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

appointmentSchema.pre('save', async function (next) {
  if (!this.appointmentId) {
    const count = await this.constructor.countDocuments();
    this.appointmentId = `APT${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Index for conflict checking
appointmentSchema.index({ doctor: 1, scheduledDate: 1, scheduledTime: 1 });
appointmentSchema.index({ patient: 1, scheduledDate: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
