const mongoose = require('mongoose');

const ambulanceSchema = new mongoose.Schema({
  vehicleId: { type: String, unique: true },
  registrationNumber: { type: String, required: true, unique: true },
  type: { type: String, enum: ['basic', 'advanced', 'mobile-icu', 'patient-transport'], default: 'basic' },
  driver: {
    name: { type: String },
    phone: { type: String },
    licenseNumber: { type: String }
  },
  equipment: [String],
  status: {
    type: String,
    enum: ['available', 'dispatched', 'on-trip', 'returning', 'maintenance'],
    default: 'available'
  },
  // Simulated GPS (clearly labeled as simulated in the UI)
  lastLocation: {
    lat: { type: Number, default: 18.5204 },
    lng: { type: Number, default: 73.8567 },
    address: { type: String, default: 'Hospital Campus' }
  },
  lastMaintenanceDate: { type: Date },
  nextMaintenanceDate: { type: Date },
  notes: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const ambulanceTripSchema = new mongoose.Schema({
  tripId: { type: String, unique: true },
  ambulance: { type: mongoose.Schema.Types.ObjectId, ref: 'Ambulance', required: true },
  emergencyCase: { type: mongoose.Schema.Types.ObjectId, ref: 'EmergencyCase' },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  dispatcher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  pickupLocation: {
    address: String,
    lat: Number,
    lng: Number
  },
  destinationLocation: {
    address: String,
    lat: Number,
    lng: Number
  },
  dispatchedAt: { type: Date, default: Date.now },
  arrivedAt: { type: Date },
  completedAt: { type: Date },
  status: { type: String, enum: ['dispatched', 'arrived', 'transporting', 'completed', 'cancelled'], default: 'dispatched' },
  notes: { type: String }
}, { timestamps: true });

ambulanceTripSchema.pre('save', async function (next) {
  if (!this.tripId) {
    const count = await this.constructor.countDocuments();
    this.tripId = `TRP${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

ambulanceSchema.pre('save', async function (next) {
  if (!this.vehicleId) {
    const count = await this.constructor.countDocuments();
    this.vehicleId = `AMB${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

module.exports = {
  Ambulance: mongoose.model('Ambulance', ambulanceSchema),
  AmbulanceTrip: mongoose.model('AmbulanceTrip', ambulanceTripSchema)
};
