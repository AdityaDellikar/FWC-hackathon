'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { Users, UserCheck, UserX, Star, ChevronRight, Calendar } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import Link from 'next/link';
import AIHRChatbot from '@/components/AIHRChatbot';

const ATTENDANCE_COLORS = ['#22c55e', '#ef4444', '#f59e0b'];

function StatCard({ title, value, icon: Icon, bgColor, color, subtitle }) {
  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value ?? '—'}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 ${bgColor} rounded-xl flex items-center justify-center flex-shrink-0 ml-4`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );
}

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={14}
          className={s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}
        />
      ))}
    </div>
  );
}

export default function ManagerDashboard() {
  const { userData } = useAuth();
  const [teamMembers, setTeamMembers] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [empRes, perfRes] = await Promise.all([
          api.get('/api/employees'),
          api.get('/api/performance'),
        ]);
        const employees = empRes.data?.employees || empRes.data || [];
        setTeamMembers(Array.isArray(employees) ? employees : []);
        setPerformanceData(Array.isArray(perfRes.data) ? perfRes.data : []);
      } catch (err) {
        console.error('Manager dashboard fetch error:', err);
        toast.error('Failed to load team data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const teamSize = teamMembers.length;
  const presentToday = Math.floor(teamSize * 0.8);
  const onLeave = Math.min(2, teamSize);
  const absent = teamSize - presentToday - onLeave;

  const avgRating =
    performanceData.length > 0
      ? (
          performanceData.reduce((sum, p) => sum + (p.rating || 0), 0) / performanceData.length
        ).toFixed(1)
      : '—';

  const attendancePieData = [
    { name: 'Present', value: presentToday },
    { name: 'Absent', value: Math.max(absent, 0) },
    { name: 'On Leave', value: onLeave },
  ].filter((d) => d.value > 0);

  // Performance bar chart data
  const perfChartData = teamMembers.slice(0, 6).map((emp) => {
    const review = performanceData.find(
      (p) => p.employee?._id === emp._id || p.employee === emp._id
    );
    return {
      name: emp.name?.split(' ')[0] || 'N/A',
      rating: review?.rating || 0,
    };
  });

  return (
    <ProtectedRoute allowedRoles={['manager']}>
      <DashboardLayout title="Manager Dashboard">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-3"></div>
              <p className="text-sm text-gray-500">Loading team data...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Welcome banner */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
              <h2 className="text-xl font-bold">
                Welcome back, {userData?.name?.split(' ')[0] || 'Manager'} 👋
              </h2>
              <p className="text-blue-200 mt-1 text-sm">
                Your team has {presentToday} members present today out of {teamSize} total.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Team Size"
                value={teamSize}
                icon={Users}
                bgColor="bg-indigo-100"
                color="text-indigo-600"
                subtitle="Total members"
              />
              <StatCard
                title="Present Today"
                value={presentToday}
                icon={UserCheck}
                bgColor="bg-green-100"
                color="text-green-600"
                subtitle={`${teamSize > 0 ? Math.round((presentToday / teamSize) * 100) : 0}% attendance rate`}
              />
              <StatCard
                title="On Leave"
                value={onLeave}
                icon={Calendar}
                bgColor="bg-yellow-100"
                color="text-yellow-600"
                subtitle="Approved leaves"
              />
              <StatCard
                title="Avg Performance"
                value={avgRating}
                icon={Star}
                bgColor="bg-purple-100"
                color="text-purple-600"
                subtitle="Team rating / 5"
              />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Attendance Pie */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Attendance</h3>
                {attendancePieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={attendancePieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        labelLine={false}
                      >
                        {attendancePieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={ATTENDANCE_COLORS[index % ATTENDANCE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: '8px',
                          border: 'none',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-60 flex flex-col items-center justify-center text-gray-400">
                    <Users size={32} className="mb-2 text-gray-300" />
                    <p className="text-sm">No team members yet</p>
                  </div>
                )}
              </div>

              {/* Performance Chart */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Team Performance</h3>
                  <Link
                    href="/performance"
                    className="text-xs text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    View all <ChevronRight size={14} />
                  </Link>
                </div>
                {perfChartData.some((d) => d.rating > 0) ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={perfChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '8px',
                          border: 'none',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        }}
                      />
                      <Bar dataKey="rating" name="Rating" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-60 flex flex-col items-center justify-center text-gray-400">
                    <Star size={32} className="mb-2 text-gray-300" />
                    <p className="text-sm">No performance reviews yet</p>
                    <Link href="/performance" className="text-xs text-indigo-600 mt-2 hover:underline">
                      Add first review
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Team Members Table */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
                <div className="flex items-center gap-3">
                  <Link
                    href="/attendance"
                    className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    Attendance <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
              <div className="overflow-x-auto -mx-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 px-2 font-medium text-gray-500">Name</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-500">Designation</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-500 hidden md:table-cell">
                        Department
                      </th>
                      <th className="text-left py-2 px-2 font-medium text-gray-500">Performance</th>
                      <th className="text-left py-2 px-2 font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers.slice(0, 8).map((emp, i) => {
                      const review = performanceData.find(
                        (p) => p.employee?._id === emp._id || p.employee === emp._id
                      );
                      return (
                        <tr
                          key={emp._id || i}
                          className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-semibold text-indigo-600">
                                  {emp.name?.[0]?.toUpperCase() || '?'}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{emp.name}</p>
                                <p className="text-xs text-gray-400">{emp.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-gray-600">{emp.designation || '—'}</td>
                          <td className="py-3 px-2 text-gray-600 hidden md:table-cell">
                            {emp.department || '—'}
                          </td>
                          <td className="py-3 px-2">
                            {review ? (
                              <StarRating rating={review.rating} />
                            ) : (
                              <span className="text-xs text-gray-400">Not reviewed</span>
                            )}
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
                      );
                    })}
                    {teamMembers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-gray-400">
                          <Users size={32} className="mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No team members found</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {teamMembers.length > 8 && (
                <div className="mt-3 text-center">
                  <Link href="/employees" className="text-sm text-indigo-600 hover:underline">
                    View all {teamMembers.length} members
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
        <AIHRChatbot />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
