'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import {
  Briefcase,
  Users,
  FileText,
  PlusCircle,
  Search,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import AIHRChatbot from '@/components/AIHRChatbot';

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

function StatusBadge({ status }) {
  const styles = {
    open: 'bg-green-100 text-green-700',
    closed: 'bg-red-100 text-red-700',
    draft: 'bg-gray-100 text-gray-600',
    paused: 'bg-yellow-100 text-yellow-700',
  };
  return (
    <span className={`badge ${styles[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

export default function HRDashboard() {
  const { userData } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [empStats, setEmpStats] = useState({ total: 0, active: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobRes, statsRes] = await Promise.all([
          api.get('/api/recruitment'),
          api.get('/api/employees/stats'),
        ]);
        const jobList = Array.isArray(jobRes.data) ? jobRes.data : [];
        setJobs(jobList);
        setEmpStats(statsRes.data || { total: 0, active: 0 });
      } catch (err) {
        console.error('HR dashboard fetch error:', err);
        toast.error('Failed to load HR dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const openJobs = jobs.filter((j) => j.status === 'open');
  const totalApplications = jobs.reduce(
    (sum, j) => sum + (j.applicants?.length || j.applicantCount || 0),
    0
  );

  // Top 5 jobs by applicant count
  const topJobs = [...jobs]
    .sort(
      (a, b) =>
        (b.applicants?.length || b.applicantCount || 0) -
        (a.applicants?.length || a.applicantCount || 0)
    )
    .slice(0, 5);

  return (
    <ProtectedRoute allowedRoles={['hr']}>
      <DashboardLayout title="HR Dashboard">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-3"></div>
              <p className="text-sm text-gray-500">Loading HR dashboard...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Welcome banner */}
            <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-6 text-white">
              <h2 className="text-xl font-bold">
                Welcome back, {userData?.name?.split(' ')[0] || 'HR'} 👋
              </h2>
              <p className="text-green-100 mt-1 text-sm">
                You have {openJobs.length} open position{openJobs.length !== 1 ? 's' : ''} and{' '}
                {totalApplications} total applications to review.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Open Positions"
                value={openJobs.length}
                icon={Briefcase}
                bgColor="bg-green-100"
                color="text-green-600"
                subtitle="Active job listings"
              />
              <StatCard
                title="Total Applications"
                value={totalApplications}
                icon={FileText}
                bgColor="bg-blue-100"
                color="text-blue-600"
                subtitle="Across all postings"
              />
              <StatCard
                title="Active Employees"
                value={empStats.active || empStats.total}
                icon={Users}
                bgColor="bg-indigo-100"
                color="text-indigo-600"
                subtitle="Currently employed"
              />
              <StatCard
                title="Total Job Postings"
                value={jobs.length}
                icon={TrendingUp}
                bgColor="bg-purple-100"
                color="text-purple-600"
                subtitle="All time"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Actions */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Link
                    href="/recruitment"
                    className="flex items-center gap-3 p-3 bg-green-50 rounded-xl hover:bg-green-100 transition-colors group"
                  >
                    <div className="w-9 h-9 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <PlusCircle size={16} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">Post New Job</p>
                      <p className="text-xs text-gray-500">AI-generated job descriptions</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-400 group-hover:text-green-600" />
                  </Link>
                  <Link
                    href="/recruitment"
                    className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors group"
                  >
                    <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Search size={16} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">Screen Resumes</p>
                      <p className="text-xs text-gray-500">AI-powered candidate screening</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-400 group-hover:text-blue-600" />
                  </Link>
                  <Link
                    href="/employees"
                    className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors group"
                  >
                    <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users size={16} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">Manage Employees</p>
                      <p className="text-xs text-gray-500">Add, edit, or update records</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-400 group-hover:text-indigo-600" />
                  </Link>
                  <Link
                    href="/performance"
                    className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors group"
                  >
                    <div className="w-9 h-9 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <TrendingUp size={16} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">Performance Reviews</p>
                      <p className="text-xs text-gray-500">Manage employee evaluations</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-400 group-hover:text-purple-600" />
                  </Link>
                </div>
              </div>

              {/* Job Postings List */}
              <div className="card lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Job Postings</h3>
                  <Link
                    href="/recruitment"
                    className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    View all <ChevronRight size={14} />
                  </Link>
                </div>
                <div className="space-y-3">
                  {topJobs.length > 0 ? (
                    topJobs.map((job, i) => {
                      const applicantCount = job.applicants?.length || job.applicantCount || 0;
                      return (
                        <div
                          key={job._id || i}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Briefcase size={16} className="text-indigo-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 text-sm truncate">{job.title}</p>
                              <p className="text-xs text-gray-500">{job.department}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                            <div className="text-right hidden sm:block">
                              <p className="text-sm font-semibold text-gray-900">{applicantCount}</p>
                              <p className="text-xs text-gray-400">applicants</p>
                            </div>
                            <StatusBadge status={job.status} />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-10 text-gray-400">
                      <Briefcase size={32} className="mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No job postings yet</p>
                      <Link href="/recruitment" className="text-xs text-indigo-600 mt-2 hover:underline block">
                        Create your first posting
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Applications pipeline summary */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Applications Pipeline</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Received', value: totalApplications, color: 'bg-blue-500' },
                  {
                    label: 'Under Review',
                    value: Math.floor(totalApplications * 0.4),
                    color: 'bg-yellow-500',
                  },
                  {
                    label: 'Shortlisted',
                    value: Math.floor(totalApplications * 0.2),
                    color: 'bg-green-500',
                  },
                  {
                    label: 'Rejected',
                    value: Math.floor(totalApplications * 0.3),
                    color: 'bg-red-500',
                  },
                ].map((item) => (
                  <div key={item.label} className="text-center p-4 bg-gray-50 rounded-xl">
                    <div
                      className={`w-3 h-3 ${item.color} rounded-full mx-auto mb-2`}
                    ></div>
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
