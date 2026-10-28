const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  patientId: { type: String, unique: true },
  name: { type: String, required: true, trim: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  phone: { type: String, required: true },
  email: { type: String, lowercase: true, trim: true },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown', ''] },
  allergies: [String],
  medicalHistory: [{
    condition: String,
    diagnosedDate: Date,
    notes: String
  }],
  isActive: { type: Boolean, default: true },
  qrToken: { type: String, unique: true, sparse: true },
  linkedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  photo: { type: String },
  notes: { type: String },
}, { timestamps: true, indexes: [{ patientId: 1 }, { phone: 1 }, { name: 'text', email: 'text', phone: 'text' }] });

// Auto-generate patient ID
patientSchema.pre('save', async function (next) {
  if (!this.patientId) {
    const count = await this.constructor.countDocuments();
    this.patientId = `PT${String(count + 1).padStart(5, '0')}`;
  }
  if (!this.qrToken) {
    this.qrToken = require('crypto').randomBytes(16).toString('hex');
  }
  next();
});

patientSchema.index({ name: 'text', email: 'text', phone: 'text', patientId: 'text' });

module.exports = mongoose.model('Patient', patientSchema);
