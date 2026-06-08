const mongoose = require('mongoose');

const performanceSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true },
    reviewPeriod: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    goals: [{ type: String }],
    achievements: [{ type: String }],
    managerNotes: { type: String },
    aiSummary: { type: String },
    reviewedBy: { type: String },
    reviewedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Performance', performanceSchema);
