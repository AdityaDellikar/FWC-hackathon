'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import {
  Users,
  Plus,
  Search,
  Edit2,
  UserX,
  X,
  Loader2,
  UserCheck,
  Mail,
  Phone,
  Building,
} from 'lucide-react';

const DEPARTMENTS = [
  'Engineering',
  'Product',
  'Design',
  'Marketing',
  'Sales',
  'HR',
  'Finance',
  'Operations',
  'Legal',
  'Customer Success',
];

const EMPTY_FORM = {
  name: '',
  email: '',
  department: '',
  designation: '',
  salary: '',
  phone: '',
  joiningDate: '',
  manager: '',
};

function EmployeeModal({ isOpen, onClose, onSubmit, loading, editData }) {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (editData) {
      setForm({
        name: editData.name || '',
        email: editData.email || '',
        department: editData.department || '',
        designation: editData.designation || '',
        salary: editData.salary || '',
        phone: editData.phone || '',
        joiningDate: editData.joiningDate
          ? new Date(editData.joiningDate).toISOString().split('T')[0]
          : '',
        manager: editData.manager || '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [editData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');
    if (!form.email.trim()) return toast.error('Email is required');
    if (!form.department) return toast.error('Department is required');
    if (!form.designation.trim()) return toast.error('Designation is required');
    if (form.salary && isNaN(Number(form.salary))) return toast.error('Salary must be a number');
    onSubmit(form);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {editData ? 'Edit Employee' : 'Add New Employee'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="input-field"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="john@company.com"
                className="input-field"
                disabled={loading || !!editData}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Department <span className="text-red-500">*</span>
              </label>
              <select
                name="department"
                value={form.department}
                onChange={handleChange}
                className="input-field"
                disabled={loading}
              >
                <option value="">Select department</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Designation <span className="text-red-500">*</span>
              </label>
              <input
                name="designation"
                value={form.designation}
                onChange={handleChange}
                placeholder="Senior Engineer"
                className="input-field"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Monthly Salary ($)
              </label>
              <input
                name="salary"
                type="number"
                value={form.salary}
                onChange={handleChange}
                placeholder="5000"
                className="input-field"
                disabled={loading}
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+1 234 567 8900"
                className="input-field"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Joining Date
              </label>
              <input
                name="joiningDate"
                type="date"
                value={form.joiningDate}
                onChange={handleChange}
                className="input-field"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Manager</label>
              <input
                name="manager"
                value={form.manager}
                onChange={handleChange}
                placeholder="Manager name"
                className="input-field"
                disabled={loading}
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Saving...' : editData ? 'Save Changes' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EmployeesPage() {
  const { role } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState('');

  const canEdit = ['admin', 'hr'].includes(role);

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/api/employees');
      const list = res.data?.employees || res.data || [];
      setEmployees(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const filtered = employees.filter((emp) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      emp.name?.toLowerCase().includes(q) ||
      emp.email?.toLowerCase().includes(q) ||
      emp.department?.toLowerCase().includes(q) ||
      emp.designation?.toLowerCase().includes(q) ||
      emp.employeeId?.toLowerCase().includes(q);
    const matchDept = !departmentFilter || emp.department === departmentFilter;
    return matchSearch && matchDept;
  });

  const handleAdd = async (form) => {
    setModalLoading(true);
    try {
      await api.post('/api/employees', {
        ...form,
        salary: form.salary ? Number(form.salary) : undefined,
      });
      toast.success('Employee added successfully');
      setShowModal(false);
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add employee');
    } finally {
      setModalLoading(false);
    }
  };

  const handleEdit = async (form) => {
    setModalLoading(true);
    try {
      await api.put(`/api/employees/${editEmployee._id}`, {
        ...form,
        salary: form.salary ? Number(form.salary) : undefined,
      });
      toast.success('Employee updated successfully');
      setEditEmployee(null);
      setShowModal(false);
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update employee');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeactivate = async (emp) => {
    if (
      !window.confirm(
        `Are you sure you want to ${emp.status === 'active' ? 'deactivate' : 'reactivate'} ${emp.name}?`
      )
    )
      return;
    try {
      const newStatus = emp.status === 'active' ? 'inactive' : 'active';
      await api.put(`/api/employees/${emp._id}`, { status: newStatus });
      toast.success(
        `Employee ${newStatus === 'active' ? 'reactivated' : 'deactivated'} successfully`
      );
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update employee status');
    }
  };

  const openEditModal = (emp) => {
    setEditEmployee(emp);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditEmployee(null);
  };

  const formatCurrency = (val) =>
    val
      ? new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0,
        }).format(val)
      : '—';

  const uniqueDepts = [...new Set(employees.map((e) => e.department).filter(Boolean))].sort();

  return (
    <ProtectedRoute allowedRoles={['admin', 'hr', 'manager']}>
      <DashboardLayout title="Employees">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Employee Directory</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {employees.length} total employees
              </p>
            </div>
            {canEdit && (
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary flex items-center gap-2 self-start sm:self-auto"
              >
                <Plus size={18} />
                Add Employee
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="card p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, email, department..."
                  className="input-field pl-9"
                />
              </div>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="input-field sm:w-48"
              >
                <option value="">All Departments</option>
                {uniqueDepts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="card overflow-hidden p-0">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="text-center">
                  <Loader2 size={32} className="animate-spin text-indigo-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Loading employees...</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Employee</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 hidden md:table-cell">
                        Department
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 hidden lg:table-cell">
                        Designation
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 hidden xl:table-cell">
                        Joined
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 hidden lg:table-cell">
                        Salary
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                      {canEdit && (
                        <th className="text-left py-3 px-4 font-medium text-gray-500">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((emp, i) => (
                      <tr
                        key={emp._id || i}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-semibold text-indigo-600">
                                {emp.name?.[0]?.toUpperCase() || '?'}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 truncate">{emp.name}</p>
                              <p className="text-xs text-gray-400 truncate">{emp.email}</p>
                              {emp.employeeId && (
                                <p className="text-xs text-gray-300">{emp.employeeId}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600 hidden md:table-cell">
                          <div className="flex items-center gap-1.5">
                            <Building size={14} className="text-gray-400" />
                            {emp.department || '—'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600 hidden lg:table-cell">
                          {emp.designation || '—'}
                        </td>
                        <td className="py-3 px-4 text-gray-600 hidden xl:table-cell">
                          {emp.joiningDate
                            ? new Date(emp.joiningDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : '—'}
                        </td>
                        <td className="py-3 px-4 text-gray-600 hidden lg:table-cell font-medium">
                          {formatCurrency(emp.salary)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`badge ${
                              emp.status === 'active'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {emp.status || 'active'}
                          </span>
                        </td>
                        {canEdit && (
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openEditModal(emp)}
                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="Edit employee"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                onClick={() => handleDeactivate(emp)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  emp.status === 'active'
                                    ? 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                                    : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                                }`}
                                title={
                                  emp.status === 'active' ? 'Deactivate' : 'Reactivate'
                                }
                              >
                                {emp.status === 'active' ? (
                                  <UserX size={15} />
                                ) : (
                                  <UserCheck size={15} />
                                )}
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                    {filtered.length === 0 && !loading && (
                      <tr>
                        <td
                          colSpan={canEdit ? 7 : 6}
                          className="text-center py-16 text-gray-400"
                        >
                          <Users size={40} className="mx-auto mb-3 text-gray-300" />
                          <p className="text-base font-medium text-gray-500">
                            {search || departmentFilter
                              ? 'No employees match your search'
                              : 'No employees found'}
                          </p>
                          {(search || departmentFilter) && (
                            <button
                              onClick={() => {
                                setSearch('');
                                setDepartmentFilter('');
                              }}
                              className="text-sm text-indigo-600 mt-2 hover:underline"
                            >
                              Clear filters
                            </button>
                          )}
                          {canEdit && !search && !departmentFilter && (
                            <button
                              onClick={() => setShowModal(true)}
                              className="btn-primary mt-3 text-sm"
                            >
                              Add first employee
                            </button>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        <EmployeeModal
          isOpen={showModal}
          onClose={closeModal}
          onSubmit={editEmployee ? handleEdit : handleAdd}
          loading={modalLoading}
          editData={editEmployee}
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
