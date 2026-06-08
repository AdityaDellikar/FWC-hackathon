'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import {
  DollarSign,
  Calendar,
  Loader2,
  CheckCircle,
  Clock,
  Download,
  Play,
} from 'lucide-react';

function formatCurrency(val) {
  if (val === undefined || val === null || val === '') return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(val));
}

export default function PayrollPage() {
  const { role, userData } = useAuth();
  const [payrollList, setPayrollList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [updatingId, setUpdatingId] = useState(null);

  const isAdmin = role === 'admin';
  const isEmployee = role === 'employee';

  const fetchPayroll = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/payroll?month=${selectedMonth}`);
      let list = Array.isArray(res.data) ? res.data : [];

      // Employees only see their own payroll
      if (isEmployee) {
        const empId = userData?.employeeId || userData?._id;
        list = list.filter(
          (p) =>
            p.employee?._id === empId ||
            p.employee === empId ||
            p.employeeId === empId
        );
      }

      setPayrollList(list);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userData !== null) {
      fetchPayroll();
    }
  }, [selectedMonth, userData]);

  const handleGeneratePayroll = async () => {
    if (!window.confirm(`Generate payroll for ${selectedMonth}? This will create payroll entries for all active employees.`)) return;
    setGenerating(true);
    try {
      await api.post('/api/payroll/generate', { month: selectedMonth });
      toast.success(`Payroll generated for ${selectedMonth}`);
      fetchPayroll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate payroll');
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkPaid = async (payrollItem) => {
    if (!window.confirm(`Mark ${payrollItem.employee?.name || 'this employee'}'s salary as paid?`)) return;
    setUpdatingId(payrollItem._id);
    try {
      await api.put(`/api/payroll/${payrollItem._id}`, { status: 'paid' });
      toast.success('Marked as paid successfully');
      fetchPayroll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update payroll status');
    } finally {
      setUpdatingId(null);
    }
  };

  // Summary stats
  const totalNetSalary = payrollList.reduce((sum, p) => sum + (p.netSalary || 0), 0);
  const paidCount = payrollList.filter((p) => p.status === 'paid').length;
  const pendingCount = payrollList.filter((p) => p.status !== 'paid').length;

  return (
    <ProtectedRoute allowedRoles={['admin', 'hr', 'manager', 'employee']}>
      <DashboardLayout title="Payroll">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Payroll Management</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {payrollList.length} payroll record{payrollList.length !== 1 ? 's' : ''} for{' '}
                {new Date(selectedMonth + '-01').toLocaleString('default', {
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={handleGeneratePayroll}
                disabled={generating}
                className="btn-primary flex items-center gap-2 self-start sm:self-auto disabled:opacity-60"
              >
                {generating ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Play size={18} />
                )}
                {generating ? 'Generating...' : 'Generate Payroll'}
              </button>
            )}
          </div>

          {/* Summary cards (admin/hr/manager only) */}
          {!isEmployee && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Payroll</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {formatCurrency(totalNetSalary)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Net salaries this month</p>
                  </div>
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-indigo-600" />
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Paid</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">{paidCount}</p>
                    <p className="text-xs text-gray-400 mt-1">Employees paid</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600 mt-1">{pendingCount}</p>
                    <p className="text-xs text-gray-400 mt-1">Awaiting payment</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Month selector */}
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <Calendar size={18} className="text-gray-400 flex-shrink-0" />
              <label className="text-sm font-medium text-gray-700">Select Month:</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="input-field max-w-[200px]"
              />
            </div>
          </div>

          {/* Payroll table */}
          <div className="card overflow-hidden p-0">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="text-center">
                  <Loader2 size={32} className="animate-spin text-indigo-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Loading payroll data...</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Employee</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">
                        Basic Salary
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 hidden md:table-cell">
                        Allowances
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 hidden md:table-cell">
                        Deductions
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">
                        Net Salary
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                      {isAdmin && (
                        <th className="text-left py-3 px-4 font-medium text-gray-500">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {payrollList.map((item, i) => {
                      const empName =
                        item.employee?.name || item.employeeName || 'Unknown';
                      const empDept = item.employee?.department || '';
                      return (
                        <tr
                          key={item._id || i}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-semibold text-indigo-600">
                                  {empName[0]?.toUpperCase() || '?'}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{empName}</p>
                                {empDept && (
                                  <p className="text-xs text-gray-400">{empDept}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-700 font-medium">
                            {formatCurrency(item.basicSalary)}
                          </td>
                          <td className="py-3 px-4 text-green-600 hidden md:table-cell">
                            {item.allowances ? `+${formatCurrency(item.allowances)}` : '—'}
                          </td>
                          <td className="py-3 px-4 text-red-600 hidden md:table-cell">
                            {item.deductions ? `-${formatCurrency(item.deductions)}` : '—'}
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-lg font-bold text-gray-900">
                              {formatCurrency(item.netSalary)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`badge ${
                                item.status === 'paid'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              {item.status === 'paid' ? (
                                <span className="flex items-center gap-1">
                                  <CheckCircle size={11} />
                                  Paid
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <Clock size={11} />
                                  {item.status || 'Pending'}
                                </span>
                              )}
                            </span>
                          </td>
                          {isAdmin && (
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                {item.status !== 'paid' && (
                                  <button
                                    onClick={() => handleMarkPaid(item)}
                                    disabled={updatingId === item._id}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors disabled:opacity-60"
                                  >
                                    {updatingId === item._id ? (
                                      <Loader2 size={12} className="animate-spin" />
                                    ) : (
                                      <CheckCircle size={12} />
                                    )}
                                    Mark Paid
                                  </button>
                                )}
                                {item.status === 'paid' && (
                                  <button
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
                                    title="Download payslip"
                                  >
                                    <Download size={12} />
                                    Payslip
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                    {payrollList.length === 0 && !loading && (
                      <tr>
                        <td
                          colSpan={isAdmin ? 7 : 6}
                          className="text-center py-16 text-gray-400"
                        >
                          <DollarSign
                            size={40}
                            className="mx-auto mb-3 text-gray-300"
                          />
                          <p className="text-base font-medium text-gray-500">
                            No payroll records for this month
                          </p>
                          {isAdmin && (
                            <button
                              onClick={handleGeneratePayroll}
                              disabled={generating}
                              className="btn-primary mt-3 text-sm flex items-center gap-2 mx-auto disabled:opacity-60"
                            >
                              {generating ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Play size={14} />
                              )}
                              Generate Payroll Now
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

          {/* Footer note */}
          {payrollList.length > 0 && (
            <div className="text-xs text-gray-400 text-center">
              Showing payroll data for{' '}
              {new Date(selectedMonth + '-01').toLocaleString('default', {
                month: 'long',
                year: 'numeric',
              })}
              . All amounts in USD.
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
