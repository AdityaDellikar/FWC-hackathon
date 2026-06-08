const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const auth = require('../middleware/auth');

// Apply auth middleware to all attendance routes
router.use(auth);

/**
 * GET /api/attendance/summary/:employeeId
 * Returns present, absent, halfDay, leave, totalDays for the current month.
 * Mounted BEFORE /:id to avoid route conflicts.
 */
router.get('/summary/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const records = await Attendance.find({
      employeeId,
      date: { $gte: startOfMonth, $lte: endOfMonth },
    });

    const summary = records.reduce(
      (acc, rec) => {
        acc.totalDays += 1;
        if (rec.status === 'present') acc.present += 1;
        else if (rec.status === 'absent') acc.absent += 1;
        else if (rec.status === 'half-day') acc.halfDay += 1;
        else if (rec.status === 'leave') acc.leave += 1;
        return acc;
      },
      { present: 0, absent: 0, halfDay: 0, leave: 0, totalDays: 0 }
    );

    res.json(summary);
  } catch (err) {
    console.error('GET /attendance/summary/:employeeId error:', err.message);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

/**
 * GET /api/attendance
 * Supports query params: employeeId, month (YYYY-MM)
 */
router.get('/', async (req, res) => {
  try {
    const { employeeId, month } = req.query;
    const filter = {};

    if (employeeId) filter.employeeId = employeeId;

    if (month) {
      // month format: YYYY-MM
      const [year, mon] = month.split('-').map(Number);
      const startOfMonth = new Date(year, mon - 1, 1);
      const endOfMonth = new Date(year, mon, 0, 23, 59, 59);
      filter.date = { $gte: startOfMonth, $lte: endOfMonth };
    }

    const attendance = await Attendance.find(filter).sort({ date: -1 });
    res.json(attendance);
  } catch (err) {
    console.error('GET /attendance error:', err.message);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

/**
 * POST /api/attendance
 * Mark attendance for an employee.
 * Body: { employeeId, date, checkIn, checkOut, status, hoursWorked }
 */
router.post('/', async (req, res) => {
  try {
    const { employeeId, date, checkIn, checkOut, status, hoursWorked } = req.body;

    if (!employeeId || !date) {
      return res.status(400).json({ error: 'employeeId and date are required' });
    }

    const attendance = new Attendance({
      employeeId,
      date: new Date(date),
      checkIn: checkIn || '',
      checkOut: checkOut || '',
      status: status || 'present',
      hoursWorked: hoursWorked || 0,
    });

    await attendance.save();
    res.status(201).json(attendance);
  } catch (err) {
    console.error('POST /attendance error:', err.message);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

/**
 * PUT /api/attendance/:id
 * Update an attendance record.
 */
router.put('/:id', async (req, res) => {
  try {
    const updates = req.body;
    delete updates._id;

    if (updates.date) updates.date = new Date(updates.date);

    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!attendance) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    res.json(attendance);
  } catch (err) {
    console.error('PUT /attendance/:id error:', err.message);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

module.exports = router;
