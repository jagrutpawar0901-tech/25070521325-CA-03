const mongoose = require('mongoose');

const emergencyCaseSchema = new mongoose.Schema({
  caseId: { type: String, unique: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  patientName: { type: String }, // For unregistered patients
  arrivalTime: { type: Date, default: Date.now },
  complaint: { type: String, required: true },
  triagePriority: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low'],
    required: true
  },
  assignedDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  assignedNurse: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ambulance: { type: mongoose.Schema.Types.ObjectId, ref: 'Ambulance' },
  location: { type: String },
  status: {
    type: String,
    enum: ['waiting', 'assessing', 'treating', 'admitted', 'transferred', 'discharged', 'closed'],
    default: 'waiting'
  },
  admission: { type: mongoose.Schema.Types.ObjectId, ref: 'Admission' },
  eventHistory: [{
    event: String,
    timestamp: { type: Date, default: Date.now },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: String
  }],
  vitalSigns: {
    bloodPressure: String,
    heartRate: Number,
    temperature: Number,
    oxygenSaturation: Number,
    respiratoryRate: Number
  },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

emergencyCaseSchema.pre('save', async function (next) {
  if (!this.caseId) {
    const count = await this.constructor.countDocuments();
    this.caseId = `EMG${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('EmergencyCase', emergencyCaseSchema);
