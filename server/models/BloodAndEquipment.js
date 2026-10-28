const mongoose = require('mongoose');

const bloodInventorySchema = new mongoose.Schema({
  bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], required: true },
  component: { type: String, enum: ['whole-blood', 'packed-rbc', 'platelets', 'fresh-frozen-plasma', 'cryoprecipitate'], default: 'whole-blood' },
  units: { type: Number, required: true, default: 0 },
  availableUnits: { type: Number, default: 0 },
  collectionDate: { type: Date },
  expiryDate: { type: Date },
  donorName: { type: String },
  donorId: { type: String },
  storageLocation: { type: String },
  status: { type: String, enum: ['available', 'reserved', 'used', 'expired', 'discarded'], default: 'available' },
  notes: { type: String },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

bloodInventorySchema.index({ bloodGroup: 1, component: 1, status: 1 });

const equipmentSchema = new mongoose.Schema({
  assetId: { type: String, unique: true },
  name: { type: String, required: true },
  category: { type: String },
  manufacturer: { type: String },
  model: { type: String },
  serialNumber: { type: String },
  supplier: { type: String },
  purchaseDate: { type: Date },
  purchaseCost: { type: Number },
  quantity: { type: Number, default: 1 },
  location: { type: String },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  condition: { type: String, enum: ['excellent', 'good', 'fair', 'poor'], default: 'good' },
  status: { type: String, enum: ['operational', 'allocated', 'maintenance', 'damaged', 'retired'], default: 'operational' },
  lastMaintenanceDate: { type: Date },
  nextMaintenanceDate: { type: Date },
  warrantyExpiry: { type: Date },
  notes: { type: String },
  serviceHistory: [{
    date: Date,
    type: String,
    description: String,
    cost: Number,
    technician: String
  }]
}, { timestamps: true });

equipmentSchema.pre('save', async function (next) {
  if (!this.assetId) {
    const count = await this.constructor.countDocuments();
    this.assetId = `EQP${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = {
  BloodInventory: mongoose.model('BloodInventory', bloodInventorySchema),
  Equipment: mongoose.model('Equipment', equipmentSchema)
};
