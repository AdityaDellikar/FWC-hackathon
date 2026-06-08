const mongoose = require('mongoose');

const applicantSchema = new mongoose.Schema({
  name: String,
  email: String,
  resumeText: String,
  aiScore: Number,
  aiSummary: String,
  appliedAt: { type: Date, default: Date.now },
});

const jobPostingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    department: { type: String, required: true },
    description: { type: String, required: true },
    requirements: [{ type: String }],
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
    applicants: [applicantSchema],
    createdBy: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('JobPosting', jobPostingSchema);
