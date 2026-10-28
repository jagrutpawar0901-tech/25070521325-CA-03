const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  category: { type: String, enum: ['consultation', 'room', 'medicine', 'lab', 'procedure', 'ambulance', 'other'] },
  quantity: { type: Number, default: 1 },
  unitPrice: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number }
}, { _id: true });

invoiceItemSchema.pre('save', function (next) {
  const subtotal = this.quantity * this.unitPrice;
  const discountAmount = (subtotal * this.discount) / 100;
  const taxAmount = ((subtotal - discountAmount) * this.tax) / 100;
  this.total = subtotal - discountAmount + taxAmount;
  next();
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, unique: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  admission: { type: mongoose.Schema.Types.ObjectId, ref: 'Admission' },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  items: [invoiceItemSchema],
  subtotal: { type: Number, default: 0 },
  totalDiscount: { type: Number, default: 0 },
  totalTax: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  outstandingAmount: { type: Number, default: 0 },
  status: { type: String, enum: ['draft', 'issued', 'partially-paid', 'paid', 'cancelled', 'refunded'], default: 'issued' },
  dueDate: { type: Date },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

invoiceSchema.pre('save', async function (next) {
  if (!this.invoiceNumber) {
    const count = await this.constructor.countDocuments();
    const year = new Date().getFullYear();
    this.invoiceNumber = `INV${year}${String(count + 1).padStart(6, '0')}`;
  }
  // Recalculate totals
  let subtotal = 0;
  this.items.forEach(item => {
    const lineTotal = item.quantity * item.unitPrice;
    const disc = (lineTotal * (item.discount || 0)) / 100;
    const tax = ((lineTotal - disc) * (item.tax || 0)) / 100;
    item.total = lineTotal - disc + tax;
    subtotal += item.total;
  });
  this.subtotal = subtotal;
  this.grandTotal = subtotal;
  this.outstandingAmount = this.grandTotal - this.paidAmount;
  next();
});

const paymentSchema = new mongoose.Schema({
  paymentId: { type: String, unique: true },
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['cash', 'card', 'upi', 'online', 'insurance', 'other'], required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'completed' },
  transactionId: { type: String },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  notes: { type: String },
  receiptNumber: { type: String },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

paymentSchema.pre('save', async function (next) {
  if (!this.paymentId) {
    const count = await this.constructor.countDocuments();
    this.paymentId = `PAY${String(count + 1).padStart(8, '0')}`;
  }
  if (!this.receiptNumber) {
    this.receiptNumber = `RCP${Date.now()}`;
  }
  next();
});

module.exports = {
  Invoice: mongoose.model('Invoice', invoiceSchema),
  Payment: mongoose.model('Payment', paymentSchema)
};
