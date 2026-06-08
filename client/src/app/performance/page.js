'use client';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { Star, Plus, X, Loader2, TrendingUp, Search, ChevronDown, ChevronUp } from 'lucide-react';
import AIPerformanceSummary from '@/components/AIPerformanceSummary';

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110 focus:outline-none"
        >
          <Star
            size={28}
            className={`transition-colors ${
              s <= (hovered || value)
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-200 fill-gray-200'
            }`}
          />
        </button>
      ))}
      {value > 0 && (
        <span className="ml-2 text-sm font-semibold text-gray-700">{value}/5</span>
      )}
    </div>
  );
}

function StarDisplay({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={16}
          className={
            s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'
          }
        />
      ))}
      <span className="ml-1 text-sm font-medium text-gray-600">{rating}/5</span>
    </div>
  );
}

const EMPTY_FORM = {
  employee: '',
  period: '',
  rating: 0,
  goals: '',
  achievements: '',
  managerNotes: '',
  aiSummary: '',
};

function PerformanceModal({ isOpen, onClose, onSubmit, loading, employees }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [expanded, setExpanded] = useState({ goals: true, achievements: true, notes: false });

  useEffect(() => {
    if (isOpen) setForm(EMPTY_FORM);
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.employee) return toast.error('Please select an employee');
    if (!form.period.trim()) return toast.error('Review period is required');
    if (!form.rating || form.rating < 1) return toast.error('Please provide a rating');
    onSubmit(form);
  };

  const selectedEmployee = employees.find((e) => e._id === form.employee);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-gray-900">Add Performance Review</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Employee + Period */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    {emp.name} — {emp.designation || emp.department}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Review Period <span className="text-red-500">*</span>
              </label>
              <input
                name="period"
                value={form.period}
                onChange={handleChange}
                placeholder="e.g. Q1 2025, Jan-Mar 2025"
                className="input-field"
                disabled={loading}
              />
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Overall Rating <span className="text-red-500">*</span>
            </label>
            <StarPicker value={form.rating} onChange={(v) => setForm((p) => ({ ...p, rating: v }))} />
            {form.rating > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                {['', 'Needs Improvement', 'Below Expectations', 'Meets Expectations', 'Exceeds Expectations', 'Outstanding'][form.rating]}
              </p>
            )}
          </div>

          {/* Goals */}
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
              onClick={() => setExpanded((p) => ({ ...p, goals: !p.goals }))}
            >
              <span className="text-sm font-medium text-gray-700">Goals</span>
              {expanded.goals ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>
            {expanded.goals && (
              <div className="p-4">
                <textarea
                  name="goals"
                  value={form.goals}
                  onChange={handleChange}
                  rows={4}
                  placeholder="List goals (one per line)&#10;e.g. Complete project X&#10;Improve code coverage to 80%"
                  className="input-field resize-none text-sm"
                  disabled={loading}
                />
              </div>
            )}
          </div>

          {/* Achievements */}
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
              onClick={() => setExpanded((p) => ({ ...p, achievements: !p.achievements }))}
            >
              <span className="text-sm font-medium text-gray-700">Achievements</span>
              {expanded.achievements ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>
            {expanded.achievements && (
              <div className="p-4">
                <textarea
                  name="achievements"
                  value={form.achievements}
                  onChange={handleChange}
                  rows={4}
                  placeholder="List achievements (one per line)&#10;e.g. Delivered project Y 2 weeks early&#10;Mentored 3 junior developers"
                  className="input-field resize-none text-sm"
                  disabled={loading}
                />
              </div>
            )}
          </div>

          {/* Manager Notes */}
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
              onClick={() => setExpanded((p) => ({ ...p, notes: !p.notes }))}
            >
              <span className="text-sm font-medium text-gray-700">Manager Notes</span>
              {expanded.notes ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>
            {expanded.notes && (
              <div className="p-4">
                <textarea
                  name="managerNotes"
                  value={form.managerNotes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Additional notes for this employee..."
                  className="input-field resize-none text-sm"
                  disabled={loading}
                />
              </div>
            )}
          </div>

          {/* AI Summary */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-indigo-900">AI Performance Summary</p>
                <p className="text-xs text-indigo-500 mt-0.5">
                  Let AI generate a professional summary based on the review data
                </p>
              </div>
              <AIPerformanceSummary
                employeeName={selectedEmployee?.name || ''}
                rating={form.rating}
                goals={form.goals}
                achievements={form.achievements}
                managerNotes={form.managerNotes}
                onSummaryGenerated={(summary) =>
                  setForm((p) => ({ ...p, aiSummary: summary }))
                }
              />
            </div>
            <textarea
              name="aiSummary"
              value={form.aiSummary}
              onChange={handleChange}
              rows={3}
              placeholder="AI-generated summary will appear here, or type manually..."
              className="input-field resize-none text-sm bg-white"
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
              {loading ? 'Saving...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ReviewDetailModal({ review, onClose }) {
  if (!review) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Performance Review Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-lg font-bold text-indigo-600">
                {review.employee?.name?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">{review.employee?.name || 'Unknown'}</p>
              <p className="text-sm text-gray-500">
                {review.employee?.designation || review.employee?.department || ''}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Period</p>
              <p className="text-sm font-medium text-gray-900">{review.reviewPeriod}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Rating</p>
              <StarDisplay rating={review.rating} />
            </div>
          </div>
          {review.goals && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Goals</p>
              <p className="text-sm text-gray-600 whitespace-pre-line bg-gray-50 rounded-lg p-3">
                {review.goals}
              </p>
            </div>
          )}
          {review.achievements && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Achievements</p>
              <p className="text-sm text-gray-600 whitespace-pre-line bg-gray-50 rounded-lg p-3">
                {review.achievements}
              </p>
            </div>
          )}
          {review.managerNotes && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Manager Notes</p>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{review.managerNotes}</p>
            </div>
          )}
          {review.aiSummary && (
            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
              <p className="text-xs font-semibold text-indigo-700 mb-2 flex items-center gap-1">
                ✨ AI Summary
              </p>
              <p className="text-sm text-indigo-900 leading-relaxed">{review.aiSummary}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PerformancePage() {
  const { role } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedReview, setSelectedReview] = useState(null);

  const canAdd = ['admin', 'hr', 'manager'].includes(role);

  const fetchData = async () => {
    try {
      const [revRes, empRes] = await Promise.all([
        api.get('/api/performance'),
        api.get('/api/employees'),
      ]);
      const empList = empRes.data?.employees || empRes.data || [];
      setEmployees(Array.isArray(empList) ? empList.filter((e) => e.status === 'active') : []);

      // Enrich reviews with employee info
      const rawReviews = Array.isArray(revRes.data) ? revRes.data : [];
      const enriched = rawReviews.map((rev) => {
        const emp = empList.find((e) => e.employeeId === rev.employeeId);
        return { ...rev, employee: emp || null };
      });
      setReviews(enriched);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = async (form) => {
    setModalLoading(true);
    try {
      const selectedEmployee = employees.find((e) => e._id === form.employee);
      await api.post('/api/performance', {
        employeeId: selectedEmployee?.employeeId || form.employee,
        reviewPeriod: form.period,
        rating: Number(form.rating),
        goals: form.goals ? form.goals.split('\n').filter(Boolean) : [],
        achievements: form.achievements ? form.achievements.split('\n').filter(Boolean) : [],
        managerNotes: form.managerNotes || '',
        aiSummary: form.aiSummary || '',
      });
      toast.success('Performance review added successfully');
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || 'Failed to add review');
    } finally {
      setModalLoading(false);
    }
  };

  const filtered = reviews.filter((rev) => {
    const q = search.toLowerCase();
    return (
      !q ||
      rev.employee?.name?.toLowerCase().includes(q) ||
      rev.employee?.department?.toLowerCase().includes(q) ||
      rev.reviewPeriod?.toLowerCase().includes(q)
    );
  });

  // Summary stats
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
      : 0;
  const topPerformers = reviews.filter((r) => r.rating >= 4).length;

  return (
    <ProtectedRoute allowedRoles={['admin', 'hr', 'manager', 'employee']}>
      <DashboardLayout title="Performance">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Performance Reviews</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {reviews.length} review{reviews.length !== 1 ? 's' : ''} on record
              </p>
            </div>
            {canAdd && (
              <button
                onClick={() => setShowModal(true)}
                className="btn-primary flex items-center gap-2 self-start sm:self-auto"
              >
                <Plus size={18} />
                Add Review
              </button>
            )}
          </div>

          {/* Stats (non-employee) */}
          {canAdd && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Reviews</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{reviews.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <TrendingUp size={22} className="text-indigo-600" />
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Average Rating</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{avgRating}/5</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                    <Star size={22} className="text-yellow-500" />
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Top Performers</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{topPerformers}</p>
                    <p className="text-xs text-gray-400">Rated 4+ stars</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Star size={22} className="text-green-600" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="card p-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by employee name, department, period..."
                className="input-field pl-9"
              />
            </div>
          </div>

          {/* Table */}
          <div className="card overflow-hidden p-0">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="text-center">
                  <Loader2 size={32} className="animate-spin text-indigo-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Loading reviews...</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Employee</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 hidden md:table-cell">
                        Period
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Rating</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 hidden lg:table-cell">
                        AI Summary
                      </th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((rev, i) => (
                      <tr key={rev._id || i} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-semibold text-indigo-600">
                                {rev.employee?.name?.[0]?.toUpperCase() || '?'}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {rev.employee?.name || 'Unknown'}
                              </p>
                              <p className="text-xs text-gray-400">
                                {rev.employee?.department || ''}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600 hidden md:table-cell">
                          <span className="badge bg-gray-100 text-gray-700">{rev.reviewPeriod}</span>
                        </td>
                        <td className="py-3 px-4">
                          <StarDisplay rating={rev.rating || 0} />
                        </td>
                        <td className="py-3 px-4 text-gray-600 hidden lg:table-cell max-w-xs">
                          {rev.aiSummary ? (
                            <p className="text-xs line-clamp-2 text-gray-500 italic">
                              "{rev.aiSummary}"
                            </p>
                          ) : (
                            <span className="text-xs text-gray-400">No AI summary</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => setSelectedReview(rev)}
                            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium hover:underline"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && !loading && (
                      <tr>
                        <td colSpan={5} className="text-center py-16 text-gray-400">
                          <Star size={40} className="mx-auto mb-3 text-gray-300" />
                          <p className="text-base font-medium text-gray-500">
                            {search ? 'No reviews match your search' : 'No performance reviews yet'}
                          </p>
                          {canAdd && !search && (
                            <button
                              onClick={() => setShowModal(true)}
                              className="btn-primary mt-3 text-sm"
                            >
                              Add first review
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

        {/* Add Review Modal */}
        <PerformanceModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={handleAdd}
          loading={modalLoading}
          employees={employees}
        />

        {/* Review Detail Modal */}
        <ReviewDetailModal
          review={selectedReview}
          onClose={() => setSelectedReview(null)}
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
