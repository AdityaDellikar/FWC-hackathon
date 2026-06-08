'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { Calendar, Plus, Search, X, Loader2, Clock, CheckCircle } from 'lucide-react';

const STATUS_STYLES = {
  present: 'bg-green-100 text-green-700',
  absent: 'bg-red-100 text-red-700',
  'half-day': 'bg-yellow-100 text-yellow-700',
  leave: 'bg-blue-100 text-blue-700',
  holiday: 'bg-purple-100 text-purple-700',
};

function AttendanceModal({ isOpen, onClose, onSubmit, loading, employees }) {
  const [form, setForm] = useState({
    employee: '',
    date: new Date().toISOString().split('T')[0],
    checkIn: '09:00',
    checkOut: '18:00',
    status: 'present',
    notes: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.employee) return toast.error('Please select an employee');
    if (!form.date) return toast.error('Date is required');
    onSubmit(form);
  };

  useEffect(() => {
    if (isOpen) {
      setForm({
        employee: '',
        date: new Date().toISOString().split('T')[0],
        checkIn: '09:00',
        checkOut: '18:00',
        status: 'present',
        notes: '',
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Mark Attendance</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Employee <span className="text-red-500">*</span>
            </label>
            <select
              name="employee"
              value={form.employee}
              onChange={handleChange}
              className="input-field"
              disabled={loading}
            >
              <option value="">Select employee</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name} — {emp.department}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                className="input-field"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="input-field"
                disabled={loading}
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="half-day">Half Day</option>
                <option value="leave">Leave</option>
                <option value="holiday">Holiday</option>
              </select>
            </div>
          </div>
          {(form.status === 'present' || form.status === 'half-day') && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Check In
                </label>
                <input
                  name="checkIn"
                  type="time"
                  value={form.checkIn}
                  onChange={handleChange}
                  className="input-field"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Check Out
                </label>
                <input
                  name="checkOut"
                  type="time"
                  value={form.checkOut}
                  onChange={handleChange}
                  className="input-field"
                  disabled={loading}
                />
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Notes (optional)
            </label>
            <input
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Any additional notes..."
              className="input-field"
              disabled={loading}
            />
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
              {loading ? 'Saving...' : 'Mark Attendance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function calcHours(checkIn, checkOut) {
  if (!checkIn || !checkOut) return '—';
  try {
    const [inH, inM] = checkIn.split(':').map(Number);
    const [outH, outM] = checkOut.split(':').map(Number);
    const totalMin = outH * 60 + outM - (inH * 60 + inM);
    if (totalMin <= 0) return '—';
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return `${h}h ${m > 0 ? `${m}m` : ''}`.trim();
  } catch {
    return '—';
  }
}

export default function AttendancePage() {
  const { role, userData } = useAuth();
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const canManage = ['admin', 'manager', 'hr'].includes(role);
  const isEmployee = role === 'employee';

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ month: selectedMonth });
      if (isEmployee && (userData?.employeeId || userData?._id)) {
        params.append('employeeId', userData.employeeId || userData._id);
      }
      const res = await api.get(`/api/attendance?${params}`);
      setRecords(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    if (!canManage) return;
    try {
      const res = await api.get('/api/employees');
      const list = res.data?.employees || res.data || [];
      setEmployees(Array.isArray(list) ? list.filter((e) => e.status === 'active') : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAttendance();
    fetchEmployees();
  }, [selectedMonth]);

  const handleMarkAttendance = async (form) => {
    setModalLoading(true);
    try {
      await api.post('/api/attendance', form);
      toast.success('Attendance marked successfully');
      setShowModal(false);
      fetchAttendance();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark attendance');
    } finally {
      setModalLoading(false);
    }
  };

  const filtered = records.filter((rec) => {
    const q = search.toLowerCase();
    return (
      !q ||
      rec.employee?.name?.toLowerCase().includes(q) ||
      rec.employee?.department?.toLowerCase().includes(q) ||
      rec.status?.toLowerCase().includes(q)
    );
  });

  // Stats
  const totalPresent = records.filter((r) => r.status === 'present').length;
  const totalAbsent = records.filter((r) => r.status === 'absent').length;
  const totalLeave = records.filter((r) => r.status === 'leave').length;
  const totalHalfDay = records.filter((r) => r.status === 'half-day').length;

  return (
    <ProtectedRoute allowedRoles={['admin', 'hr', 'manager', 'employee']}>
      <DashboardLayout title="Attendance">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {records.length} records for{' '}
                {new Date(selectedMonth + '-01').toLocaleString('default', {
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
            {canManage && (
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary flex items-center gap-2 self-start sm:self-auto"
              >
                <Plus size={18} />
                Mark Attendance
              </button>
            )}
          </div>

          {/* Stats row */}
          {!isEmployee && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Present', value: totalPresent, color: 'bg-green-50 text-green-700 border-green-100' },
                { label: 'Absent', value: totalAbsent, color: 'bg-red-50 text-red-700 border-red-100' },
                { label: 'On Leave', value: totalLeave, color: 'bg-blue-50 text-blue-700 border-blue-100' },
                { label: 'Half Day', value: totalHalfDay, color: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`card border ${item.color} text-center py-4`}
                >
                  <p className="text-3xl font-bold">{item.value}</p>
                  <p className="text-sm mt-1 opacity-80">{item.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Filters */}
          <div className="card p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-gray-400 flex-shrink-0" />
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="input-field"
                />
              </div>
              {canManage && (
                <div className="relative flex-1">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, department, status..."
                    className="input-field pl-9"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="card overflow-hidden p-0">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="text-center">
                  <Loader2 size={32} className="animate-spin text-indigo-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Loading attendance records...</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {canManage && (
                        <th className="text-left py-3 px-4 font-medium text-gray-500">
                          Employee
                        </th>
                      )}
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">
                        Check In
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">
                        Check Out
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 hidden md:table-cell">
                        Hours
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((rec, i) => (
                      <tr key={rec._id || i} className="hover:bg-gray-50 transition-colors">
                        {canManage && (
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-semibold text-indigo-600">
                                  {rec.employee?.name?.[0]?.toUpperCase() || '?'}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {rec.employee?.name || 'Unknown'}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {rec.employee?.department || ''}
                                </p>
                              </div>
                            </div>
                          </td>
                        )}
                        <td className="py-3 px-4 text-gray-700">
                          {rec.date
                            ? new Date(rec.date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })
                            : '—'}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock size={13} className="text-gray-400" />
                            {rec.checkIn || '—'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          <div className="flex items-center gap-1">
                            <CheckCircle size={13} className="text-gray-400" />
                            {rec.checkOut || '—'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600 hidden md:table-cell font-medium">
                          {calcHours(rec.checkIn, rec.checkOut)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`badge ${STATUS_STYLES[rec.status] || 'bg-gray-100 text-gray-600'}`}
                          >
                            {rec.status || 'unknown'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && !loading && (
                      <tr>
                        <td
                          colSpan={canManage ? 6 : 5}
                          className="text-center py-16 text-gray-400"
                        >
                          <Calendar size={40} className="mx-auto mb-3 text-gray-300" />
                          <p className="text-base font-medium text-gray-500">
                            No attendance records found
                          </p>
                          <p className="text-sm text-gray-400 mt-1">
                            {search
                              ? 'Try adjusting your search'
                              : 'No records for this month yet'}
                          </p>
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
        <AttendanceModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={handleMarkAttendance}
          loading={modalLoading}
          employees={employees}
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
