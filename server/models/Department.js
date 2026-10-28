const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  code: { type: String, unique: true },
  description: { type: String },
  head: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  floor: { type: String },
  phone: { type: String },
  isActive: { type: Boolean, default: true },
  color: { type: String, default: '#0891b2' }
}, { timestamps: true });

module.exports = mongoose.model('Department', departmentSchema);
