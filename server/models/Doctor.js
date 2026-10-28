const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  doctorId: { type: String, unique: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, lowercase: true },
  phone: { type: String },
  specialty: { type: String, required: true },
  qualifications: [String],
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  departmentName: { type: String },
  consultationFee: { type: Number, default: 500 },
  appointmentDuration: { type: Number, default: 15 }, // minutes
  workingDays: [{
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  }],
  workingHours: {
    start: { type: String, default: '09:00' },
    end: { type: String, default: '17:00' }
  },
  isAvailable: { type: Boolean, default: true },
  photo: { type: String },
  bio: { type: String },
  linkedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  registrationNumber: { type: String },
  experience: { type: Number }, // years
  languages: [String],
  rating: { type: Number, default: 4.5, min: 0, max: 5 },
  totalConsultations: { type: Number, default: 0 },
}, { timestamps: true });

doctorSchema.pre('save', async function (next) {
  if (!this.doctorId) {
    const count = await this.constructor.countDocuments();
    this.doctorId = `DR${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

doctorSchema.index({ name: 'text', specialty: 'text', departmentName: 'text' });

module.exports = mongoose.model('Doctor', doctorSchema);
