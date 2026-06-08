const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    userId: { type: String },
    employeeId: { type: String, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    department: { type: String, required: true },
    designation: { type: String, required: true },
    joiningDate: { type: Date, default: Date.now },
    salary: { type: Number, required: true },
    phone: { type: String },
    address: { type: String },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    manager: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Employee', employeeSchema);
