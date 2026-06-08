'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import {
  Calendar,
  DollarSign,
  Star,
  Umbrella,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import AIHRChatbot from '@/components/AIHRChatbot';

function StatCard({ title, value, icon: Icon, bgColor, color, subtitle }) {
  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value ?? '—'}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div
          className={`w-12 h-12 ${bgColor} rounded-xl flex items-center justify-center flex-shrink-0 ml-4`}
        >
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );
}

const STATUS_CONFIG = {
  present: { label: 'P', bg: 'bg-green-100 text-green-700', title: 'Present' },
  absent: { label: 'A', bg: 'bg-red-100 text-red-700', title: 'Absent' },
  leave: { label: 'L', bg: 'bg-blue-100 text-blue-700', title: 'Leave' },
  holiday: { label: 'H', bg: 'bg-purple-100 text-purple-700', title: 'Holiday' },
  weekend: { label: '', bg: 'bg-gray-50 text-gray-300', title: 'Weekend' },
  future: { label: '', bg: 'bg-white text-gray-200 border border-gray-100', title: '' },
};

function AttendanceCalendar({ attendanceRecords }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const today = now.getDate();

  // Build date→status map
  const statusMap = {};
  (attendanceRecords || []).forEach((rec) => {
    const d = new Date(rec.date);
    if (d.getMonth() === month && d.getFullYear() === year) {
      statusMap[d.getDate()] = rec.status;
    }
  });

  const cells = [];
  // Empty leading cells
  for (let i = 0; i < firstDay; i++) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isFuture = day > today;
    const status = isWeekend
      ? 'weekend'
      : isFuture
      ? 'future'
      : statusMap[day] || 'absent';
    cells.push({ day, status });
  }

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, i) =>
          cell === null ? (
            <div key={`empty-${i}`} />
          ) : (
            <div
              key={cell.day}
              title={STATUS_CONFIG[cell.status]?.title}
              className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-semibold ${
                STATUS_CONFIG[cell.status]?.bg || 'bg-gray-50'
              } ${cell.day === today ? 'ring-2 ring-indigo-400' : ''}`}
            >
              <span className="text-[10px] text-gray-400 leading-none">{cell.day}</span>
              <span className="text-[11px] font-bold leading-tight">
                {STATUS_CONFIG[cell.status]?.label || ''}
              </span>
            </div>
          )
        )}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3">
        {[
          { key: 'present', label: 'Present' },
          { key: 'absent', label: 'Absent' },
          { key: 'leave', label: 'Leave' },
          { key: 'holiday', label: 'Holiday' },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center gap-1">
            <div
              className={`w-4 h-4 rounded ${STATUS_CONFIG[key].bg.split(' ')[0]} flex items-center justify-center`}
            >
              <span className={`text-[9px] font-bold ${STATUS_CONFIG[key].bg.split(' ')[1]}`}>
                {STATUS_CONFIG[key].label}
              </span>
            </div>
            <span className="text-xs text-gray-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EmployeeDashboard() {
  const { userData } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [payroll, setPayroll] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!userData) return;
      const now = new Date();
      const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      try {
        const queries = [];

        // Attendance
        const empId = userData.employeeId || userData._id;
        if (empId) {
          queries.push(
            api
              .get(`/api/attendance?employeeId=${empId}&month=${monthStr}`)
              .catch(() => ({ data: [] }))
          );
        } else {
          queries.push(Promise.resolve({ data: [] }));
        }

        // Payroll
        queries.push(
          api
            .get(`/api/payroll?month=${monthStr}`)
            .catch(() => ({ data: [] }))
        );

        // Performance
        queries.push(
          api
            .get('/api/performance')
            .catch(() => ({ data: [] }))
        );

        const [attRes, payRes, perfRes] = await Promise.all(queries);

        const attList = Array.isArray(attRes.data) ? attRes.data : [];
        setAttendance(attList);

        const payList = Array.isArray(payRes.data) ? payRes.data : [];
        const myPayroll = payList.find(
          (p) =>
            p.employee?._id === empId ||
            p.employee === empId ||
            p.employeeId === empId
        );
        setPayroll(myPayroll || null);

        const perfList = Array.isArray(perfRes.data) ? perfRes.data : [];
        const myPerf = perfList.find(
          (p) =>
            p.employee?._id === empId ||
            p.employee === empId
        );
        setPerformance(myPerf || null);
      } catch (err) {
        console.error('Employee dashboard fetch error:', err);
        toast.error('Failed to load your dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userData]);

  // Calculate attendance %
  const now = new Date();
  const workingDaysElapsed = Array.from(
    { length: now.getDate() },
    (_, i) => new Date(now.getFullYear(), now.getMonth(), i + 1)
  ).filter((d) => d.getDay() !== 0 && d.getDay() !== 6).length;

  const presentDays = attendance.filter((a) => a.status === 'present').length;
  const attendancePct =
    workingDaysElapsed > 0 ? Math.round((presentDays / workingDaysElapsed) * 100) : 0;

  const netSalary = payroll?.netSalary || payroll?.basicSalary || userData?.salary || 0;
  const perfRating = performance?.rating || 0;

  const formatCurrency = (val) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  return (
    <ProtectedRoute allowedRoles={['employee']}>
      <DashboardLayout title="My Dashboard">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-3"></div>
              <p className="text-sm text-gray-500">Loading your dashboard...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Welcome banner */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-6 text-white">
              <h2 className="text-xl font-bold">
                Welcome back, {userData?.name?.split(' ')[0] || 'Employee'} 👋
              </h2>
              <p className="text-indigo-100 mt-1 text-sm">
                {userData?.designation && `${userData.designation} · `}
                {userData?.department && `${userData.department} Department`}
              </p>
              <div className="flex flex-wrap gap-4 mt-3">
                <div className="flex items-center gap-2 text-white/80 text-sm">
                  <Calendar size={14} />
                  <span>
                    Joined:{' '}
                    {userData?.joiningDate
                      ? new Date(userData.joiningDate).toLocaleDateString('en-US', {
                          month: 'long',
                          year: 'numeric',
                        })
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-white/80 text-sm">
                  <CheckCircle size={14} />
                  <span>{presentDays} days present this month</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Attendance This Month"
                value={`${attendancePct}%`}
                icon={Calendar}
                bgColor="bg-green-100"
                color="text-green-600"
                subtitle={`${presentDays} of ${workingDaysElapsed} working days`}
              />
              <StatCard
                title="Monthly Salary"
                value={netSalary ? formatCurrency(netSalary) : 'N/A'}
                icon={DollarSign}
                bgColor="bg-blue-100"
                color="text-blue-600"
                subtitle={payroll?.status === 'paid' ? '✓ Paid' : payroll ? 'Pending payment' : 'Not processed'}
              />
              <StatCard
                title="Performance Rating"
                value={perfRating ? `${perfRating}/5` : 'N/A'}
                icon={Star}
                bgColor="bg-yellow-100"
                color="text-yellow-600"
                subtitle={performance?.period || 'Latest review'}
              />
              <StatCard
                title="Leaves Remaining"
                value="12"
                icon={Umbrella}
                bgColor="bg-purple-100"
                color="text-purple-600"
                subtitle="Annual leave balance"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Attendance Calendar */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {now.toLocaleString('default', { month: 'long', year: 'numeric' })} Attendance
                  </h3>
                  <Link
                    href="/attendance"
                    className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    Full view <ChevronRight size={14} />
                  </Link>
                </div>
                <AttendanceCalendar attendanceRecords={attendance} />
              </div>

              {/* Payslip Card + Performance */}
              <div className="space-y-4">
                {/* Latest Payslip */}
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Latest Payslip</h3>
                    <Link
                      href="/payroll"
                      className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      View all <ChevronRight size={14} />
                    </Link>
                  </div>
                  {payroll ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-gray-50">
                        <span className="text-sm text-gray-500">Basic Salary</span>
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(payroll.basicSalary || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-50">
                        <span className="text-sm text-gray-500">Allowances</span>
                        <span className="text-sm font-medium text-green-600">
                          +{formatCurrency(payroll.allowances || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-50">
                        <span className="text-sm text-gray-500">Deductions</span>
                        <span className="text-sm font-medium text-red-600">
                          -{formatCurrency(payroll.deductions || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 bg-indigo-50 rounded-lg px-3">
                        <span className="text-sm font-semibold text-indigo-700">Net Salary</span>
                        <span className="text-lg font-bold text-indigo-700">
                          {formatCurrency(payroll.netSalary || 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          Period: {payroll.month || 'Current month'}
                        </span>
                        <span
                          className={`badge ${
                            payroll.status === 'paid'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {payroll.status || 'pending'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-400">
                      <DollarSign size={32} className="mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No payslip for this month yet</p>
                    </div>
                  )}
                </div>

                {/* Performance Summary */}
                <div className="card">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">Latest Performance</h3>
                    <Link
                      href="/performance"
                      className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      View all <ChevronRight size={14} />
                    </Link>
                  </div>
                  {performance ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Period</span>
                        <span className="text-sm font-medium text-gray-900">{performance.period}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Rating</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={16}
                              className={
                                s <= performance.rating
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-gray-200 fill-gray-200'
                              }
                            />
                          ))}
                          <span className="text-sm font-semibold text-gray-900 ml-1">
                            {performance.rating}/5
                          </span>
                        </div>
                      </div>
                      {performance.aiSummary && (
                        <div className="bg-indigo-50 rounded-lg p-3">
                          <p className="text-xs font-medium text-indigo-700 mb-1">AI Summary</p>
                          <p className="text-xs text-gray-700 leading-relaxed line-clamp-3">
                            {performance.aiSummary}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-400">
                      <Star size={32} className="mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No performance review yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Attendance Status breakdown */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">This Month Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    label: 'Present',
                    value: attendance.filter((a) => a.status === 'present').length,
                    icon: CheckCircle,
                    color: 'text-green-600',
                    bg: 'bg-green-50',
                  },
                  {
                    label: 'Absent',
                    value: Math.max(
                      workingDaysElapsed -
                        attendance.filter((a) => ['present', 'leave', 'half-day'].includes(a.status))
                          .length,
                      0
                    ),
                    icon: XCircle,
                    color: 'text-red-600',
                    bg: 'bg-red-50',
                  },
                  {
                    label: 'On Leave',
                    value: attendance.filter((a) => a.status === 'leave').length,
                    icon: Umbrella,
                    color: 'text-blue-600',
                    bg: 'bg-blue-50',
                  },
                  {
                    label: 'Half Day',
                    value: attendance.filter((a) => a.status === 'half-day').length,
                    icon: Clock,
                    color: 'text-yellow-600',
                    bg: 'bg-yellow-50',
                  },
                ].map((item) => (
                  <div key={item.label} className={`${item.bg} rounded-xl p-4 text-center`}>
                    <item.icon size={24} className={`${item.color} mx-auto mb-2`} />
                    <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <AIHRChatbot />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
