const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const auth = require('../middleware/auth');

// Apply auth middleware to all employee routes
router.use(auth);

/**
 * GET /api/employees/stats
 * Returns aggregate stats: total, active, inactive, departments.
 * IMPORTANT: mounted before /:id to avoid route conflict.
 */
router.get('/stats', async (req, res) => {
  try {
    const [total, active, inactive, departments] = await Promise.all([
      Employee.countDocuments(),
      Employee.countDocuments({ status: 'active' }),
      Employee.countDocuments({ status: 'inactive' }),
      Employee.aggregate([
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $project: { _id: 0, name: '$_id', count: 1 } },
        { $sort: { name: 1 } },
      ]),
    ]);

    res.json({ total, active, inactive, departments });
  } catch (err) {
    console.error('GET /employees/stats error:', err.message);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

/**
 * GET /api/employees
 * Supports query params: department, status, search (name)
 */
router.get('/', async (req, res) => {
  try {
    const { department, status, search } = req.query;
    const filter = {};

    if (department) filter.department = department;
    if (status) filter.status = status;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const employees = await Employee.find(filter).sort({ createdAt: -1 });
    res.json(employees);
  } catch (err) {
    console.error('GET /employees error:', err.message);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

/**
 * GET /api/employees/:id
 * Get a single employee by MongoDB _id.
 */
router.get('/:id', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(employee);
  } catch (err) {
    console.error('GET /employees/:id error:', err.message);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

/**
 * POST /api/employees
 * Create a new employee. Auto-generates employeeId (EMP001, EMP002, ...).
 */
router.post('/', async (req, res) => {
  try {
    const { name, email, department, designation, salary, phone, address, manager, joiningDate, userId } = req.body;

    if (!name || !email || !department || !designation || salary === undefined) {
      return res.status(400).json({
        error: 'name, email, department, designation, and salary are required',
      });
    }

    // Generate next employeeId
    const lastEmployee = await Employee.findOne({}, {}, { sort: { createdAt: -1 } });
    let nextNumber = 1;
    if (lastEmployee && lastEmployee.employeeId) {
      const lastNum = parseInt(lastEmployee.employeeId.replace('EMP', ''), 10);
      if (!isNaN(lastNum)) nextNumber = lastNum + 1;
    }
    const employeeId = `EMP${String(nextNumber).padStart(3, '0')}`;

    const employee = new Employee({
      userId: userId || '',
      employeeId,
      name,
      email,
      department,
      designation,
      salary,
      phone: phone || '',
      address: address || '',
      manager: manager || '',
      joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
      status: 'active',
    });

    await employee.save();
    res.status(201).json(employee);
  } catch (err) {
    console.error('POST /employees error:', err.message);
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Employee ID conflict, please retry' });
    }
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

/**
 * PUT /api/employees/:id
 * Update employee fields.
 */
router.put('/:id', async (req, res) => {
  try {
    const updates = req.body;

    // Prevent overwriting the auto-generated employeeId accidentally
    delete updates._id;

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(employee);
  } catch (err) {
    console.error('PUT /employees/:id error:', err.message);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

/**
 * DELETE /api/employees/:id
 * Soft delete — sets status to 'inactive'.
 */
router.delete('/:id', async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'inactive' } },
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({ message: 'Employee deactivated successfully', employee });
  } catch (err) {
    console.error('DELETE /employees/:id error:', err.message);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

module.exports = router;
