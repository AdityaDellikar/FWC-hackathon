const express = require('express');
const router = express.Router();
const Performance = require('../models/Performance');
const auth = require('../middleware/auth');

// Apply auth middleware to all performance routes
router.use(auth);

/**
 * GET /api/performance
 * Get all performance reviews.
 */
router.get('/', async (req, res) => {
  try {
    const reviews = await Performance.find().sort({ reviewedAt: -1 });
    res.json(reviews);
  } catch (err) {
    console.error('GET /performance error:', err.message);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

/**
 * GET /api/performance/:employeeId
 * Get all performance reviews for a specific employee.
 */
router.get('/:employeeId', async (req, res) => {
  try {
    const reviews = await Performance.find({
      employeeId: req.params.employeeId,
    }).sort({ reviewedAt: -1 });

    res.json(reviews);
  } catch (err) {
    console.error('GET /performance/:employeeId error:', err.message);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

/**
 * POST /api/performance
 * Create a new performance review.
 * Body: { employeeId, reviewPeriod, rating, goals, achievements, managerNotes, reviewedBy, aiSummary? }
 */
router.post('/', async (req, res) => {
  try {
    const {
      employeeId,
      reviewPeriod,
      rating,
      goals,
      achievements,
      managerNotes,
      reviewedBy,
      aiSummary,
    } = req.body;

    if (!employeeId || !reviewPeriod || rating === undefined) {
      return res.status(400).json({
        error: 'employeeId, reviewPeriod, and rating are required',
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'rating must be between 1 and 5' });
    }

    const review = new Performance({
      employeeId,
      reviewPeriod,
      rating,
      goals: goals || [],
      achievements: achievements || [],
      managerNotes: managerNotes || '',
      reviewedBy: reviewedBy || req.user.uid,
      aiSummary: aiSummary || '',
    });

    await review.save();
    res.status(201).json(review);
  } catch (err) {
    console.error('POST /performance error:', err.message);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

/**
 * PUT /api/performance/:id
 * Update a performance review (including setting aiSummary).
 */
router.put('/:id', async (req, res) => {
  try {
    const updates = req.body;
    delete updates._id;

    if (updates.rating !== undefined && (updates.rating < 1 || updates.rating > 5)) {
      return res.status(400).json({ error: 'rating must be between 1 and 5' });
    }

    const review = await Performance.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!review) {
      return res.status(404).json({ error: 'Performance review not found' });
    }

    res.json(review);
  } catch (err) {
    console.error('PUT /performance/:id error:', err.message);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

module.exports = router;
