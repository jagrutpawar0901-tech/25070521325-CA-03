const mongoose = require('mongoose');

const prescriptionItemSchema = new mongoose.Schema({
  medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' },
  medicineName: { type: String, required: true }, // stored for historical accuracy
  strength: { type: String },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true },
  duration: { type: String, required: true },
  route: { type: String, enum: ['oral', 'intravenous', 'intramuscular', 'subcutaneous', 'topical', 'inhalation', 'other'], default: 'oral' },
  instructions: { type: String },
  quantity: { type: Number },
  dispensed: { type: Boolean, default: false }
}, { _id: true });

const prescriptionSchema = new mongoose.Schema({
  prescriptionId: { type: String, unique: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  admission: { type: mongoose.Schema.Types.ObjectId, ref: 'Admission' },
  medicines: [prescriptionItemSchema],
  diagnosis: { type: String },
  notes: { type: String },
  status: { type: String, enum: ['active', 'dispensed', 'partially-dispensed', 'cancelled', 'expired'], default: 'active' },
  validUntil: { type: Date },
  dispensedAt: { type: Date },
  dispensedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

prescriptionSchema.pre('save', async function (next) {
  if (!this.prescriptionId) {
    const count = await this.constructor.countDocuments();
    this.prescriptionId = `RX${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Prescription', prescriptionSchema);
