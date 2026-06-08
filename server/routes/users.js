const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

/**
 * GET /api/users/me
 * Returns the currently authenticated user's profile from MongoDB.
 */
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid }).lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('GET /me error:', err.message);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

/**
 * POST /api/users/register
 * Creates a new User document in MongoDB after Firebase registration.
 * Body: { uid, email, name, role? }
 */
router.post('/register', async (req, res) => {
  try {
    const { uid, email, name, role } = req.body;

    if (!uid || !email || !name) {
      return res.status(400).json({ error: 'uid, email, and name are required' });
    }

    // Upsert: create if not exists, return existing if already registered
    const existing = await User.findOne({ uid });
    if (existing) {
      return res.status(200).json(existing);
    }

    const user = new User({
      uid,
      email,
      name,
      role: role || 'employee',
    });

    await user.save();
    res.status(201).json(user);
  } catch (err) {
    console.error('POST /register error:', err.message);
    if (err.code === 11000) {
      return res.status(409).json({ error: 'User already exists' });
    }
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

module.exports = router;
