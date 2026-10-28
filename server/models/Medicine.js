const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  medicineId: { type: String, unique: true },
  name: { type: String, required: true, trim: true },
  genericName: { type: String, trim: true },
  manufacturer: { type: String },
  category: { type: String, enum: ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment', 'drops', 'inhaler', 'patch', 'other'] },
  strength: { type: String },
  unit: { type: String, default: 'piece' },
  purchasePrice: { type: Number, default: 0 },
  sellingPrice: { type: Number, default: 0 },
  totalStock: { type: Number, default: 0 },
  reorderLevel: { type: Number, default: 10 },
  storageLocation: { type: String },
  requiresPrescription: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  description: { type: String },
  sideEffects: [String],
  contraindications: [String]
}, { timestamps: true });

medicineSchema.pre('save', async function (next) {
  if (!this.medicineId) {
    const count = await this.constructor.countDocuments();
    this.medicineId = `MED${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

medicineSchema.index({ name: 'text', genericName: 'text', manufacturer: 'text' });

const medicineBatchSchema = new mongoose.Schema({
  medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
  batchNumber: { type: String, required: true },
  manufacturer: { type: String },
  manufactureDate: { type: Date },
  expiryDate: { type: Date, required: true },
  purchasePrice: { type: Number },
  sellingPrice: { type: Number },
  quantity: { type: Number, required: true, default: 0 },
  remainingQuantity: { type: Number },
  supplier: { type: String },
  invoiceNumber: { type: String },
  receivedDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['active', 'expired', 'recalled', 'exhausted'], default: 'active' }
}, { timestamps: true });

medicineBatchSchema.pre('save', function (next) {
  if (this.isNew && this.remainingQuantity === undefined) {
    this.remainingQuantity = this.quantity;
  }
  next();
});

const inventoryTransactionSchema = new mongoose.Schema({
  medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'MedicineBatch' },
  type: { type: String, enum: ['received', 'dispensed', 'adjusted', 'expired', 'returned', 'damaged'], required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number },
  totalAmount: { type: Number },
  reference: { type: String }, // Prescription ID, Invoice ID, etc.
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String }
}, { timestamps: true });

module.exports = {
  Medicine: mongoose.model('Medicine', medicineSchema),
  MedicineBatch: mongoose.model('MedicineBatch', medicineBatchSchema),
  InventoryTransaction: mongoose.model('InventoryTransaction', inventoryTransactionSchema)
};
