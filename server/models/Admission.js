const mongoose = require('mongoose');

const admissionSchema = new mongoose.Schema({
  admissionId: { type: String, unique: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  ward: { type: mongoose.Schema.Types.ObjectId, ref: 'Ward' },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  bed: { type: mongoose.Schema.Types.ObjectId, ref: 'Bed' },
  admissionDate: { type: Date, required: true, default: Date.now },
  dischargeDate: { type: Date },
  expectedDischargeDate: { type: Date },
  diagnosis: { type: String },
  admissionType: { type: String, enum: ['planned', 'emergency', 'transfer'], default: 'planned' },
  status: { type: String, enum: ['active', 'discharged', 'transferred', 'absconded'], default: 'active' },
  notes: { type: String },
  emergencyCase: { type: mongoose.Schema.Types.ObjectId, ref: 'EmergencyCase' },
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  dischargeSummary: { type: mongoose.Schema.Types.ObjectId, ref: 'DischargeSummary' },
  transferDetails: { type: String },
  attendingNurse: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

admissionSchema.pre('save', async function (next) {
  if (!this.admissionId) {
    const count = await this.constructor.countDocuments();
    this.admissionId = `ADM${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

admissionSchema.index({ patient: 1, status: 1 });
admissionSchema.index({ bed: 1, status: 1 });

module.exports = mongoose.model('Admission', admissionSchema);
