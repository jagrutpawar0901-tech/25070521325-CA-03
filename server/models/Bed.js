const mongoose = require('mongoose');

const wardSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['general', 'private', 'semi-private', 'icu', 'emergency', 'pediatric', 'maternity', 'surgical'], required: true },
  floor: { type: String },
  totalBeds: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  notes: { type: String }
}, { timestamps: true });

const roomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true },
  ward: { type: mongoose.Schema.Types.ObjectId, ref: 'Ward', required: true },
  type: { type: String, enum: ['general', 'private', 'semi-private', 'icu', 'emergency'], required: true },
  floor: { type: String },
  ratePerDay: { type: Number, default: 1000 },
  isActive: { type: Boolean, default: true },
  amenities: [String]
}, { timestamps: true });

const bedSchema = new mongoose.Schema({
  bedNumber: { type: String, required: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  ward: { type: mongoose.Schema.Types.ObjectId, ref: 'Ward', required: true },
  type: { type: String, enum: ['general', 'icu', 'emergency', 'private', 'semi-private'], default: 'general' },
  status: {
    type: String,
    enum: ['available', 'occupied', 'reserved', 'cleaning', 'maintenance'],
    default: 'available'
  },
  currentPatient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  currentAdmission: { type: mongoose.Schema.Types.ObjectId, ref: 'Admission' },
  lastCleanedAt: { type: Date },
  notes: { type: String }
}, { timestamps: true });

bedSchema.index({ ward: 1, status: 1 });

module.exports = {
  Ward: mongoose.model('Ward', wardSchema),
  Room: mongoose.model('Room', roomSchema),
  Bed: mongoose.model('Bed', bedSchema)
};
