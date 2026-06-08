'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Users,
  Clock,
  DollarSign,
  Briefcase,
  TrendingUp,
  ChevronRight,
  Activity,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import Link from 'next/link';
import AIHRChatbot from '@/components/AIHRChatbot';

function StatCard({ title, value, icon: Icon, color, bgColor, subtitle, trend }) {
  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value ?? '—'}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          {trend && (
            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
              <TrendingUp size={12} /> {trend}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 ${bgColor} rounded-xl flex items-center justify-center flex-shrink-0 ml-4`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({ total: 0, active: 0, departments: [] });
  const [recentEmployees, setRecentEmployees] = useState([]);
  const [openJobs, setOpenJobs] = useState(0);
  const [totalJobs, setTotalJobs] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, empRes, jobRes] = await Promise.all([
          api.get('/api/employees/stats'),
          api.get('/api/employees?limit=5'),
          api.get('/api/recruitment'),
        ]);
        setStats(statsRes.data || { total: 0, active: 0, departments: [] });
        const empList = empRes.data?.employees || empRes.data || [];
        setRecentEmployees(Array.isArray(empList) ? empList : []);
        const jobs = Array.isArray(jobRes.data) ? jobRes.data : [];
        setOpenJobs(jobs.filter((j) => j.status === 'open').length);
        setTotalJobs(jobs.length);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const deptChartData = (stats.departments || []).map((d) => ({
    name: d.name?.length > 10 ? d.name.slice(0, 10) + '…' : d.name,
    count: d.count,
  }));

  // Mock monthly headcount trend data
  const trendData = [
    { month: 'Jan', employees: Math.max((stats.total || 0) - 8, 0) },
    { month: 'Feb', employees: Math.max((stats.total || 0) - 6, 0) },
    { month: 'Mar', employees: Math.max((stats.total || 0) - 4, 0) },
    { month: 'Apr', employees: Math.max((stats.total || 0) - 2, 0) },
    { month: 'May', employees: Math.max((stats.total || 0) - 1, 0) },
    { month: 'Jun', employees: stats.total || 0 },
  ];

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <DashboardLayout title="Admin Dashboard">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-3"></div>
              <p className="text-sm text-gray-500">Loading dashboard...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Welcome banner */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Welcome back, Admin 👋</h2>
                  <p className="text-indigo-200 mt-1 text-sm">
                    Here's what's happening across HireFlow today.
                  </p>
                </div>
                <div className="hidden md:flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2">
                  <Activity size={18} className="text-indigo-200" />
                  <span className="text-sm font-medium">
                    {new Date().toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Employees"
                value={stats.total}
                icon={Users}
                bgColor="bg-indigo-100"
                color="text-indigo-600"
                subtitle="All departments"
                trend="+2 this month"
              />
              <StatCard
                title="Active Today"
                value={stats.active}
                icon={Clock}
                bgColor="bg-green-100"
                color="text-green-600"
                subtitle="Present & working"
              />
              <StatCard
                title="Departments"
                value={(stats.departments || []).length}
                icon={TrendingUp}
                bgColor="bg-purple-100"
                color="text-purple-600"
                subtitle="Active departments"
              />
              <StatCard
                title="Open Positions"
                value={openJobs}
                icon={Briefcase}
                bgColor="bg-orange-100"
                color="text-orange-600"
                subtitle={`${totalJobs} total postings`}
              />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Department Chart */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Department Headcount</h3>
                  <Link href="/employees" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                    View all <ChevronRight size={14} />
                  </Link>
                </div>
                {deptChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={deptChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="count" name="Employees" fill="#4F46E5" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-60 flex flex-col items-center justify-center text-gray-400">
                    <Users size={32} className="mb-2 text-gray-300" />
                    <p className="text-sm">No department data yet</p>
                  </div>
                )}
              </div>

              {/* Headcount Trend */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Headcount Trend</h3>
                  <span className="text-xs text-gray-400">Last 6 months</span>
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={trendData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="employees"
                      name="Employees"
                      stroke="#4F46E5"
                      strokeWidth={2.5}
                      dot={{ fill: '#4F46E5', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bottom row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Actions */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Link
                    href="/employees"
                    className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors group"
                  >
                    <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users size={16} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">Manage Employees</p>
                      <p className="text-xs text-gray-500 truncate">Add, edit, or deactivate employees</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-400 group-hover:text-indigo-600 flex-shrink-0" />
                  </Link>
                  <Link
                    href="/payroll"
                    className="flex items-center gap-3 p-3 bg-green-50 rounded-xl hover:bg-green-100 transition-colors group"
                  >
                    <div className="w-9 h-9 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <DollarSign size={16} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">Generate Payroll</p>
                      <p className="text-xs text-gray-500 truncate">Process monthly salaries</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-400 group-hover:text-green-600 flex-shrink-0" />
                  </Link>
                  <Link
                    href="/recruitment"
                    className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors group"
                  >
                    <div className="w-9 h-9 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Briefcase size={16} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">Post New Job</p>
                      <p className="text-xs text-gray-500 truncate">AI JD generator included</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-400 group-hover:text-orange-600 flex-shrink-0" />
                  </Link>
                  <Link
                    href="/performance"
                    className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors group"
                  >
                    <div className="w-9 h-9 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <TrendingUp size={16} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">Performance Reviews</p>
                      <p className="text-xs text-gray-500 truncate">Add AI-powered reviews</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-400 group-hover:text-purple-600 flex-shrink-0" />
                  </Link>
                </div>
              </div>

              {/* Recent Employees */}
              <div className="card lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Employees</h3>
                  <Link
                    href="/employees"
                    className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    View all <ChevronRight size={14} />
                  </Link>
                </div>
                <div className="overflow-x-auto -mx-2">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2 px-2 font-medium text-gray-500">Name</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-500">Department</th>
                        <th className="text-left py-2 px-2 font-medium text-gray-500 hidden md:table-cell">
                          Designation
                        </th>
                        <th className="text-left py-2 px-2 font-medium text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentEmployees.slice(0, 5).map((emp, i) => (
                        <tr
                          key={emp._id || i}
                          className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-3 px-2 font-medium text-gray-900">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-semibold text-indigo-600">
                                  {emp.name?.[0]?.toUpperCase() || '?'}
                                </span>
                              </div>
                              {emp.name}
                            </div>
                          </td>
                          <td className="py-3 px-2 text-gray-600">{emp.department}</td>
                          <td className="py-3 px-2 text-gray-600 hidden md:table-cell">
                            {emp.designation}
                          </td>
                          <td className="py-3 px-2">
                            <span
                              className={`badge ${
                                emp.status === 'active'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {emp.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {recentEmployees.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center py-10 text-gray-400">
                            <Users size={32} className="mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">No employees yet. Add your first employee!</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
        <AIHRChatbot />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
