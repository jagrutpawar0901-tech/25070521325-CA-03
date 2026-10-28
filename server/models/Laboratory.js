const mongoose = require('mongoose');

const labTestCatalogSchema = new mongoose.Schema({
  testCode: { type: String, unique: true },
  name: { type: String, required: true },
  category: { type: String },
  price: { type: Number, required: true },
  turnaroundHours: { type: Number, default: 24 },
  sampleType: { type: String },
  description: { type: String },
  referenceRanges: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const labOrderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  tests: [{
    test: { type: mongoose.Schema.Types.ObjectId, ref: 'LabTestCatalog' },
    testName: String,
    price: Number,
    status: { type: String, enum: ['ordered', 'scheduled', 'sample-collected', 'processing', 'completed', 'cancelled'], default: 'ordered' },
    result: { type: String },
    reportUrl: { type: String },
    completedAt: { type: Date }
  }],
  status: { type: String, enum: ['ordered', 'scheduled', 'sample-collected', 'processing', 'completed', 'cancelled'], default: 'ordered' },
  sampleCollectedAt: { type: Date },
  sampleCollectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String },
  totalAmount: { type: Number },
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

labOrderSchema.pre('save', async function (next) {
  if (!this.orderId) {
    const count = await this.constructor.countDocuments();
    this.orderId = `LAB${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = {
  LabTestCatalog: mongoose.model('LabTestCatalog', labTestCatalogSchema),
  LabOrder: mongoose.model('LabOrder', labOrderSchema)
};
