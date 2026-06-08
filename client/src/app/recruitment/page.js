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
  Plus,
  X,
  Loader2,
  Search,
  Eye,
  ChevronLeft,
  FileText,
  Bot,
} from 'lucide-react';
import AIJDGenerator from '@/components/AIJDGenerator';
import AIResumeScreener from '@/components/AIResumeScreener';

const TABS = ['Job Postings', 'Applications', 'Screen Resumes'];

function ScoreBadge({ score }) {
  if (score === undefined || score === null) return <span className="text-xs text-gray-400">N/A</span>;
  const color =
    score >= 70
      ? 'bg-green-100 text-green-700'
      : score >= 40
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-red-100 text-red-700';
  return <span className={`badge ${color} font-semibold`}>{score}/100</span>;
}

function StatusBadge({ status }) {
  const styles = {
    open: 'bg-green-100 text-green-700',
    closed: 'bg-red-100 text-red-700',
    draft: 'bg-gray-100 text-gray-600',
    paused: 'bg-yellow-100 text-yellow-700',
  };
  return (
    <span className={`badge ${styles[status] || 'bg-gray-100 text-gray-600'} capitalize`}>
      {status}
    </span>
  );
}

const EMPTY_JOB_FORM = {
  title: '',
  department: '',
  location: '',
  type: 'full-time',
  status: 'open',
  description: '',
  requirements: '',
  salary: '',
};

function PostJobModal({ isOpen, onClose, onSubmit, loading }) {
  const [step, setStep] = useState(1); // 1: AI JD, 2: Job Details
  const [form, setForm] = useState(EMPTY_JOB_FORM);

  useEffect(() => {
    if (isOpen) {
      setForm(EMPTY_JOB_FORM);
      setStep(1);
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUseJD = (jdResult) => {
    setForm((prev) => ({
      ...prev,
      title: jdResult.title || prev.title,
      description: [jdResult.overview, ...(jdResult.responsibilities || [])].join('\n'),
      requirements: (jdResult.requirements || []).join('\n'),
    }));
    setStep(2);
    toast.success('JD applied — fill in the remaining details');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Job title is required');
    if (!form.department.trim()) return toast.error('Department is required');
    onSubmit(form);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft size={18} className="text-gray-500" />
              </button>
            )}
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {step === 1 ? '✨ AI Job Description Generator' : 'Post New Job'}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Step {step} of 2 —{' '}
                {step === 1 ? 'Generate or skip to manual entry' : 'Fill in job details'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <AIJDGenerator onUseJD={handleUseJD} />
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">or skip AI generation</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <button
                onClick={() => setStep(2)}
                className="w-full btn-secondary flex items-center justify-center gap-2"
              >
                <FileText size={16} />
                Enter Job Details Manually
              </button>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    placeholder="e.g. Senior Software Engineer"
                    className="input-field"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    placeholder="e.g. Engineering"
                    className="input-field"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Location
                  </label>
                  <input
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="e.g. Remote, New York"
                    className="input-field"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Employment Type
                  </label>
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    className="input-field"
                    disabled={loading}
                  >
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Salary Range
                  </label>
                  <input
                    name="salary"
                    value={form.salary}
                    onChange={handleChange}
                    placeholder="e.g. $80,000 - $120,000"
                    className="input-field"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Status
                  </label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="input-field"
                    disabled={loading}
                  >
                    <option value="open">Open</option>
                    <option value="draft">Draft</option>
                    <option value="paused">Paused</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Job Description
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Describe the role, responsibilities, and what the candidate will be doing..."
                  className="input-field resize-none text-sm"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Requirements (one per line)
                </label>
                <textarea
                  name="requirements"
                  value={form.requirements}
                  onChange={handleChange}
                  rows={4}
                  placeholder="5+ years of experience&#10;Proficiency in React&#10;Strong communication skills"
                  className="input-field resize-none text-sm"
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
                  {loading ? 'Posting...' : 'Post Job'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function JobDetailModal({ job, onClose, onUpdateStatus }) {
  const [updating, setUpdating] = useState(false);

  if (!job) return null;

  const applicants = job.applicants || [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{job.title}</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {job.department} · {job.location || 'Remote'} · {job.type}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <StatusBadge status={job.status} />
            {job.salary && (
              <span className="badge bg-indigo-100 text-indigo-700">{job.salary}</span>
            )}
            <span className="badge bg-gray-100 text-gray-600">
              {applicants.length} applicant{applicants.length !== 1 ? 's' : ''}
            </span>
          </div>
          {job.description && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Description</p>
              <p className="text-sm text-gray-600 whitespace-pre-line bg-gray-50 rounded-lg p-3 leading-relaxed">
                {job.description}
              </p>
            </div>
          )}
          {applicants.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Applicants</p>
              <div className="space-y-2">
                {applicants.map((app, i) => (
                  <div
                    key={app._id || i}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{app.name}</p>
                      <p className="text-xs text-gray-400">{app.email}</p>
                    </div>
                    <ScoreBadge score={app.aiScore} />
                  </div>
                ))}
              </div>
            </div>
          )}
          {applicants.length === 0 && (
            <div className="text-center py-6 bg-gray-50 rounded-xl">
              <Users size={28} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm text-gray-400">No applicants yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RecruitmentPage() {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPostModal, setShowPostModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const canPost = ['admin', 'hr'].includes(role);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/recruitment');
      setJobs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load job postings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handlePostJob = async (form) => {
    setModalLoading(true);
    try {
      const payload = {
        ...form,
        requirements: form.requirements
          ? form.requirements.split('\n').map((r) => r.trim()).filter(Boolean)
          : [],
      };
      await api.post('/api/recruitment', payload);
      toast.success('Job posted successfully');
      setShowPostModal(false);
      fetchJobs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post job');
    } finally {
      setModalLoading(false);
    }
  };

  // All applicants across all jobs
  const allApplicants = jobs.flatMap((job) =>
    (job.applicants || []).map((app) => ({
      ...app,
      jobTitle: job.title,
      jobDept: job.department,
    }))
  );

  const filteredJobs = jobs.filter((job) => {
    const q = search.toLowerCase();
    const matchQ =
      !q ||
      job.title?.toLowerCase().includes(q) ||
      job.department?.toLowerCase().includes(q) ||
      job.location?.toLowerCase().includes(q);
    const matchStatus = !statusFilter || job.status === statusFilter;
    return matchQ && matchStatus;
  });

  const filteredApplicants = allApplicants.filter((app) => {
    const q = search.toLowerCase();
    return (
      !q ||
      app.name?.toLowerCase().includes(q) ||
      app.email?.toLowerCase().includes(q) ||
      app.jobTitle?.toLowerCase().includes(q)
    );
  });

  // Stats
  const openJobs = jobs.filter((j) => j.status === 'open').length;
  const totalApplicants = allApplicants.length;

  return (
    <ProtectedRoute allowedRoles={['admin', 'hr', 'manager', 'employee']}>
      <DashboardLayout title="Recruitment">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Recruitment</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {openJobs} open position{openJobs !== 1 ? 's' : ''} · {totalApplicants} total applicants
              </p>
            </div>
            {canPost && (
              <button
                onClick={() => setShowPostModal(true)}
                className="btn-primary flex items-center gap-2 self-start sm:self-auto"
              >
                <Plus size={18} />
                Post New Job
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Open Positions', value: openJobs, color: 'bg-green-50 text-green-700 border-green-100' },
              { label: 'Total Postings', value: jobs.length, color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
              { label: 'Total Applicants', value: totalApplicants, color: 'bg-blue-50 text-blue-700 border-blue-100' },
              {
                label: 'High Scorers',
                value: allApplicants.filter((a) => (a.aiScore || 0) >= 70).length,
                color: 'bg-purple-50 text-purple-700 border-purple-100',
              },
            ].map((item) => (
              <div key={item.label} className={`card border ${item.color} text-center py-4`}>
                <p className={`text-3xl font-bold`}>{item.value}</p>
                <p className="text-sm mt-1 opacity-80">{item.label}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex gap-1">
              {TABS.map((tab, idx) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(idx);
                    setSearch('');
                  }}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === idx
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab}
                  {tab === 'Job Postings' && jobs.length > 0 && (
                    <span className="ml-2 badge bg-gray-100 text-gray-600">{jobs.length}</span>
                  )}
                  {tab === 'Applications' && allApplicants.length > 0 && (
                    <span className="ml-2 badge bg-indigo-100 text-indigo-600">
                      {allApplicants.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab !== 2 && (
            <div className="card p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={
                      activeTab === 0
                        ? 'Search jobs by title, department...'
                        : 'Search applicants by name, email...'
                    }
                    className="input-field pl-9"
                  />
                </div>
                {activeTab === 0 && (
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="input-field sm:w-40"
                  >
                    <option value="">All Status</option>
                    <option value="open">Open</option>
                    <option value="draft">Draft</option>
                    <option value="paused">Paused</option>
                    <option value="closed">Closed</option>
                  </select>
                )}
              </div>
            </div>
          )}

          {/* Tab 0: Job Postings */}
          {activeTab === 0 && (
            <div className="card overflow-hidden p-0">
              {loading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="text-center">
                    <Loader2 size={32} className="animate-spin text-indigo-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Loading job postings...</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Job Title</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500 hidden md:table-cell">
                          Department
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500 hidden lg:table-cell">
                          Type
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">
                          Applicants
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredJobs.map((job, i) => {
                        const applicantCount = job.applicants?.length || job.applicantCount || 0;
                        return (
                          <tr key={job._id || i} className="hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Briefcase size={16} className="text-orange-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{job.title}</p>
                                  {job.location && (
                                    <p className="text-xs text-gray-400">{job.location}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-600 hidden md:table-cell">
                              {job.department}
                            </td>
                            <td className="py-3 px-4 hidden lg:table-cell">
                              <span className="badge bg-gray-100 text-gray-600 capitalize">
                                {job.type || 'full-time'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5">
                                <Users size={14} className="text-gray-400" />
                                <span className="font-medium text-gray-900">{applicantCount}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <StatusBadge status={job.status} />
                            </td>
                            <td className="py-3 px-4">
                              <button
                                onClick={() => setSelectedJob(job)}
                                className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium hover:underline"
                              >
                                <Eye size={14} />
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredJobs.length === 0 && !loading && (
                        <tr>
                          <td colSpan={6} className="text-center py-16 text-gray-400">
                            <Briefcase size={40} className="mx-auto mb-3 text-gray-300" />
                            <p className="text-base font-medium text-gray-500">
                              {search || statusFilter
                                ? 'No jobs match your filters'
                                : 'No job postings yet'}
                            </p>
                            {canPost && !search && !statusFilter && (
                              <button
                                onClick={() => setShowPostModal(true)}
                                className="btn-primary mt-3 text-sm"
                              >
                                Post first job
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
          )}

          {/* Tab 1: Applications */}
          {activeTab === 1 && (
            <div className="card overflow-hidden p-0">
              {loading ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 size={32} className="animate-spin text-indigo-600 mx-auto mb-2 block" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">
                          Applicant
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500 hidden md:table-cell">
                          Applied For
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">
                          AI Score
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500 hidden lg:table-cell">
                          Summary
                        </th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500 hidden md:table-cell">
                          Applied
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredApplicants.map((app, i) => (
                        <tr key={app._id || i} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-semibold text-blue-600">
                                  {app.name?.[0]?.toUpperCase() || '?'}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{app.name}</p>
                                <p className="text-xs text-gray-400">{app.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 hidden md:table-cell">
                            <p className="text-sm text-gray-700">{app.jobTitle}</p>
                            <p className="text-xs text-gray-400">{app.jobDept}</p>
                          </td>
                          <td className="py-3 px-4">
                            <ScoreBadge score={app.aiScore} />
                          </td>
                          <td className="py-3 px-4 hidden lg:table-cell max-w-xs">
                            <p className="text-xs text-gray-500 line-clamp-2">
                              {app.aiSummary || app.summary || '—'}
                            </p>
                          </td>
                          <td className="py-3 px-4 text-gray-500 hidden md:table-cell text-xs">
                            {app.appliedAt
                              ? new Date(app.appliedAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : '—'}
                          </td>
                        </tr>
                      ))}
                      {filteredApplicants.length === 0 && !loading && (
                        <tr>
                          <td colSpan={5} className="text-center py-16 text-gray-400">
                            <Users size={40} className="mx-auto mb-3 text-gray-300" />
                            <p className="text-base font-medium text-gray-500">
                              {search ? 'No applicants match your search' : 'No applications yet'}
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Screen Resumes */}
          {activeTab === 2 && (
            <div>
              <div className="flex items-center gap-2 mb-4 text-sm text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                <Bot size={16} />
                <span>
                  Use AI to analyze and score candidate resumes against your open job postings.
                </span>
              </div>
              <AIResumeScreener
                jobPostings={jobs.filter((j) => j.status === 'open')}
                onSave={async ({ jobId, name, email, resumeText, aiScore, aiSummary }) => {
                  try {
                    await api.post(`/api/recruitment/${jobId}/apply`, {
                      name,
                      email,
                      resumeText,
                      aiScore,
                      aiSummary,
                    });
                    toast.success(`${name} saved to Applications!`);
                    fetchJobs(); // refresh so Applications tab shows the new entry
                  } catch (err) {
                    toast.error(err.response?.data?.error || 'Failed to save applicant');
                    throw err; // re-throw so the component knows save failed
                  }
                }}
              />
            </div>
          )}
        </div>

        {/* Post Job Modal */}
        <PostJobModal
          isOpen={showPostModal}
          onClose={() => setShowPostModal(false)}
          onSubmit={handlePostJob}
          loading={modalLoading}
        />

        {/* Job Detail Modal */}
        <JobDetailModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
