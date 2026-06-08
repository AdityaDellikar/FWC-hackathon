const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true },
    date: { type: Date, required: true },
    checkIn: { type: String },
    checkOut: { type: String },
    status: {
      type: String,
      enum: ['present', 'absent', 'half-day', 'leave'],
      default: 'present',
    },
    hoursWorked: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Attendance', attendanceSchema);
