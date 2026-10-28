const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['appointment', 'admission', 'bed', 'emergency', 'ambulance', 'medicine', 'invoice', 'lab', 'reminder', 'system', 'other'],
    default: 'system'
  },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  link: { type: String }, // Frontend route
  relatedId: { type: mongoose.Schema.Types.ObjectId },
  relatedModel: { type: String },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' }
}, { timestamps: true });

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

const auditLogSchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  actorEmail: { type: String },
  actorRole: { type: String },
  action: { type: String, required: true },
  module: { type: String },
  resourceId: { type: String },
  resourceModel: { type: String },
  details: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String },
  status: { type: String, enum: ['success', 'failed', 'unauthorized'], default: 'success' }
}, { timestamps: true });

auditLogSchema.index({ actor: 1, createdAt: -1 });
auditLogSchema.index({ module: 1, createdAt: -1 });

const queueTokenSchema = new mongoose.Schema({
  tokenNumber: { type: String, unique: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  date: { type: Date, required: true },
  position: { type: Number },
  estimatedWaitMinutes: { type: Number },
  status: { type: String, enum: ['waiting', 'called', 'serving', 'served', 'skipped', 'cancelled'], default: 'waiting' },
  calledAt: { type: Date },
  servedAt: { type: Date },
  checkedInAt: { type: Date, default: Date.now },
  isWalkIn: { type: Boolean, default: false }
}, { timestamps: true });

queueTokenSchema.pre('save', async function (next) {
  if (!this.tokenNumber) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const count = await this.constructor.countDocuments({ createdAt: { $gte: today } });
    this.tokenNumber = `Q${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

const medicineReminderSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  prescription: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription' },
  medicineName: { type: String, required: true },
  dosage: { type: String },
  frequency: { type: String },
  times: [String], // e.g., ['08:00', '14:00', '20:00']
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  isActive: { type: Boolean, default: true },
  history: [{
    scheduledTime: Date,
    status: { type: String, enum: ['taken', 'skipped', 'missed'] },
    recordedAt: Date
  }]
}, { timestamps: true });

const hospitalSettingSchema = new mongoose.Schema({
  key: { type: String, unique: true, required: true },
  value: { type: mongoose.Schema.Types.Mixed },
  category: { type: String },
  description: { type: String },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const familyRelationshipSchema = new mongoose.Schema({
  primaryPatient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  relatedPatient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  relationship: { type: String, required: true },
  consentGiven: { type: Boolean, default: false },
  consentDate: { type: Date },
  accessLevel: { type: String, enum: ['view', 'full'], default: 'view' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const medicalRecordSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  admission: { type: mongoose.Schema.Types.ObjectId, ref: 'Admission' },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  type: { type: String, enum: ['consultation', 'discharge', 'surgery', 'diagnosis', 'progress', 'other'] },
  chiefComplaint: { type: String },
  symptoms: [String],
  diagnosis: [String],
  clinicalNotes: { type: String },
  treatmentPlan: { type: String },
  vitalSigns: {
    bloodPressure: String,
    heartRate: Number,
    temperature: Number,
    weight: Number,
    height: Number,
    oxygenSaturation: Number
  },
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  isConfidential: { type: Boolean, default: false },
  accessLog: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    accessedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

medicalRecordSchema.index({ patient: 1, createdAt: -1 });

const dischargeSummarySchema = new mongoose.Schema({
  summaryId: { type: String, unique: true },
  admission: { type: mongoose.Schema.Types.ObjectId, ref: 'Admission', required: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  admissionDate: { type: Date },
  dischargeDate: { type: Date },
  finalDiagnosis: [String],
  procedures: [String],
  clinicalSummary: { type: String },
  investigations: { type: String },
  dischargeMedications: [{
    medicine: String,
    dosage: String,
    frequency: String,
    duration: String
  }],
  followUpInstructions: { type: String },
  followUpDate: { type: Date },
  condition: { type: String, enum: ['improved', 'stable', 'critical', 'deceased', 'transferred'] },
  status: { type: String, enum: ['draft', 'pending-approval', 'approved', 'issued'], default: 'draft' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  versions: [{ content: mongoose.Schema.Types.Mixed, savedAt: Date, savedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } }]
}, { timestamps: true });

dischargeSummarySchema.pre('save', async function (next) {
  if (!this.summaryId) {
    const count = await this.constructor.countDocuments();
    this.summaryId = `DS${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

const consultationSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  scheduledAt: { type: Date, required: true },
  status: { type: String, enum: ['scheduled', 'in-progress', 'completed', 'cancelled'], default: 'scheduled' },
  sessionUrl: { type: String }, // Video session URL (demo)
  notes: { type: String },
  messages: [{
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: String,
    sentAt: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false }
  }],
  startedAt: { type: Date },
  endedAt: { type: Date }
}, { timestamps: true });

module.exports = {
  Notification: mongoose.model('Notification', notificationSchema),
  AuditLog: mongoose.model('AuditLog', auditLogSchema),
  QueueToken: mongoose.model('QueueToken', queueTokenSchema),
  MedicineReminder: mongoose.model('MedicineReminder', medicineReminderSchema),
  HospitalSetting: mongoose.model('HospitalSetting', hospitalSettingSchema),
  FamilyRelationship: mongoose.model('FamilyRelationship', familyRelationshipSchema),
  MedicalRecord: mongoose.model('MedicalRecord', medicalRecordSchema),
  DischargeSummary: mongoose.model('DischargeSummary', dischargeSummarySchema),
  Consultation: mongoose.model('Consultation', consultationSchema)
};
