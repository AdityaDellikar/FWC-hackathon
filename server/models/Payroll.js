const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true },
    month: { type: String, required: true },
    basicSalary: { type: Number, required: true },
    allowances: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    netSalary: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
    paidOn: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payroll', payrollSchema);
