const express = require('express');
const router = express.Router();
const JobPosting = require('../models/JobPosting');
const auth = require('../middleware/auth');

// Apply auth middleware to all recruitment routes
router.use(auth);

/**
 * GET /api/recruitment
 * Get all job postings.
 */
router.get('/', async (req, res) => {
  try {
    const { status, department } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (department) filter.department = department;

    const postings = await JobPosting.find(filter).sort({ createdAt: -1 });
    res.json(postings);
  } catch (err) {
    console.error('GET /recruitment error:', err.message);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

/**
 * GET /api/recruitment/:id
 * Get a single job posting with all applicants.
 */
router.get('/:id', async (req, res) => {
  try {
    const posting = await JobPosting.findById(req.params.id);
    if (!posting) {
      return res.status(404).json({ error: 'Job posting not found' });
    }
    res.json(posting);
  } catch (err) {
    console.error('GET /recruitment/:id error:', err.message);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

/**
 * POST /api/recruitment
 * Create a new job posting.
 * Body: { title, department, description, requirements? }
 */
router.post('/', async (req, res) => {
  try {
    const { title, department, description, requirements } = req.body;

    if (!title || !department || !description) {
      return res.status(400).json({
        error: 'title, department, and description are required',
      });
    }

    const posting = new JobPosting({
      title,
      department,
      description,
      requirements: requirements || [],
      status: 'open',
      applicants: [],
      createdBy: req.user.uid,
    });

    await posting.save();
    res.status(201).json(posting);
  } catch (err) {
    console.error('POST /recruitment error:', err.message);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

/**
 * PUT /api/recruitment/:id
 * Update a job posting (title, description, status, requirements, etc.).
 */
router.put('/:id', async (req, res) => {
  try {
    const updates = req.body;
    delete updates._id;
    delete updates.applicants; // Applicants are managed via the /apply sub-route

    const posting = await JobPosting.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!posting) {
      return res.status(404).json({ error: 'Job posting not found' });
    }

    res.json(posting);
  } catch (err) {
    console.error('PUT /recruitment/:id error:', err.message);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

/**
 * POST /api/recruitment/:id/apply
 * Add an applicant to a job posting.
 * Body: { name, email, resumeText, aiScore, aiSummary }
 */
router.post('/:id/apply', async (req, res) => {
  try {
    const { name, email, resumeText, aiScore, aiSummary } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'name and email are required' });
    }

    const posting = await JobPosting.findById(req.params.id);
    if (!posting) {
      return res.status(404).json({ error: 'Job posting not found' });
    }

    if (posting.status === 'closed') {
      return res.status(400).json({ error: 'This job posting is closed' });
    }

    const applicant = {
      name,
      email,
      resumeText: resumeText || '',
      aiScore: aiScore || 0,
      aiSummary: aiSummary || '',
      appliedAt: new Date(),
    };

    posting.applicants.push(applicant);
    await posting.save();

    // Return the newly added applicant (last in array)
    const newApplicant = posting.applicants[posting.applicants.length - 1];
    res.status(201).json({ applicant: newApplicant, posting });
  } catch (err) {
    console.error('POST /recruitment/:id/apply error:', err.message);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

module.exports = router;
