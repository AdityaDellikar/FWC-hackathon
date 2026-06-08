const express = require('express');
const router = express.Router();
const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const auth = require('../middleware/auth');

// Apply auth middleware to all payroll routes
router.use(auth);

/**
 * GET /api/payroll
 * Supports query params: month (YYYY-MM), employeeId
 */
router.get('/', async (req, res) => {
  try {
    const { month, employeeId } = req.query;
    const filter = {};

    if (month) filter.month = month;
    if (employeeId) filter.employeeId = employeeId;

    const payrolls = await Payroll.find(filter).sort({ createdAt: -1 });
    res.json(payrolls);
  } catch (err) {
    console.error('GET /payroll error:', err.message);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

/**
 * POST /api/payroll/generate
 * Generate payroll for all active employees for a given month.
 * Body: { month } — format: YYYY-MM
 * Skips employees that already have a payroll record for that month.
 */
router.post('/generate', async (req, res) => {
  try {
    const { month } = req.body;

    if (!month) {
      return res.status(400).json({ error: 'month is required (format: YYYY-MM)' });
    }

    const activeEmployees = await Employee.find({ status: 'active' });

    if (activeEmployees.length === 0) {
      return res.status(200).json({ message: 'No active employees found', generated: [] });
    }

    const results = [];
    const skipped = [];

    for (const emp of activeEmployees) {
      // Skip if record already exists for this month
      const existing = await Payroll.findOne({ employeeId: emp.employeeId, month });
      if (existing) {
        skipped.push(emp.employeeId);
        continue;
      }

      const basicSalary = emp.salary;
      const allowances = Math.round(basicSalary * 0.2);
      const deductions = Math.round(basicSalary * 0.1);
      const netSalary = basicSalary + allowances - deductions;

      const payroll = new Payroll({
        employeeId: emp.employeeId,
        month,
        basicSalary,
        allowances,
        deductions,
        netSalary,
        status: 'pending',
      });

      await payroll.save();
      results.push(payroll);
    }

    res.status(201).json({
      message: `Payroll generated for ${results.length} employees`,
      generated: results,
      skipped,
    });
  } catch (err) {
    console.error('POST /payroll/generate error:', err.message);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

/**
 * GET /api/payroll/:employeeId
 * Get full payroll history for a single employee.
 */
router.get('/:employeeId', async (req, res) => {
  try {
    const payrolls = await Payroll.find({ employeeId: req.params.employeeId }).sort({
      month: -1,
    });
    res.json(payrolls);
  } catch (err) {
    console.error('GET /payroll/:employeeId error:', err.message);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

/**
 * PUT /api/payroll/:id
 * Update a payroll record (e.g., mark as paid).
 */
router.put('/:id', async (req, res) => {
  try {
    const updates = req.body;
    delete updates._id;

    if (updates.status === 'paid' && !updates.paidOn) {
      updates.paidOn = new Date();
    }

    const payroll = await Payroll.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!payroll) {
      return res.status(404).json({ error: 'Payroll record not found' });
    }

    res.json(payroll);
  } catch (err) {
    console.error('PUT /payroll/:id error:', err.message);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

module.exports = router;
