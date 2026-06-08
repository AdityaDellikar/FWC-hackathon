'use client';
import { useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Search, CheckCircle, XCircle, Loader2, Save } from 'lucide-react';

export default function AIResumeScreener({ jobPostings = [], onSave }) {
  const [selectedJob, setSelectedJob] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleScreen = async () => {
    if (!resumeText.trim()) return toast.error('Please paste resume text');
    if (jobPostings.length > 0 && !selectedJob) return toast.error('Please select a job posting');
    setLoading(true);
    setResult(null);
    try {
      const job = jobPostings.find(j => j._id === selectedJob);
      const res = await api.post('/api/ai/screen-resume', {
        resumeText,
        jobTitle: job?.title || 'General Role',
        requirements: job?.requirements || [],
      });
      setResult(res.data);
      toast.success('Resume screened successfully');
    } catch (err) {
      toast.error('Failed to screen resume');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!applicantName.trim()) return toast.error('Enter applicant name to save');
    if (!applicantEmail.trim()) return toast.error('Enter applicant email to save');
    if (!selectedJob) return toast.error('Select a job posting to save the applicant');
    setSaving(true);
    try {
      await onSave({
        jobId: selectedJob,
        name: applicantName.trim(),
        email: applicantEmail.trim(),
        resumeText,
        aiScore: result.score,
        aiSummary: result.summary,
      });
      // Reset form after successful save
      setResult(null);
      setResumeText('');
      setApplicantName('');
      setApplicantEmail('');
    } finally {
      setSaving(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score) => {
    if (score >= 70) return 'bg-green-50 border-green-200';
    if (score >= 40) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getBadgeColor = (rec) => {
    if (rec === 'Strong Fit') return 'bg-green-100 text-green-800';
    if (rec === 'Moderate Fit') return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Search className="text-indigo-600" size={20} />
          AI Resume Screener
        </h3>

        {/* Applicant info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Applicant Name</label>
            <input
              value={applicantName}
              onChange={e => setApplicantName(e.target.value)}
              placeholder="e.g. John Doe"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Applicant Email</label>
            <input
              type="email"
              value={applicantEmail}
              onChange={e => setApplicantEmail(e.target.value)}
              placeholder="e.g. john@example.com"
              className="input-field"
            />
          </div>
        </div>

        {/* Job selector */}
        {jobPostings.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Job Posting</label>
            <select
              value={selectedJob}
              onChange={e => setSelectedJob(e.target.value)}
              className="input-field"
            >
              <option value="">— Select a job —</option>
              {jobPostings.map(job => (
                <option key={job._id} value={job._id}>{job.title} — {job.department}</option>
              ))}
            </select>
          </div>
        )}

        {/* Resume text */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Resume Text</label>
          <textarea
            value={resumeText}
            onChange={e => setResumeText(e.target.value)}
            rows={10}
            placeholder="Paste resume text here..."
            className="input-field resize-none font-mono text-sm"
          />
        </div>

        <button
          onClick={handleScreen}
          disabled={loading}
          className="btn-primary flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          {loading ? 'Analyzing...' : 'Screen Resume'}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className={`card border ${getScoreBg(result.score)}`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className={`text-5xl font-bold ${getScoreColor(result.score)}`}>{result.score}</div>
              <div className="text-sm text-gray-500 mt-1">Match Score / 100</div>
            </div>
            <span className={`badge ${getBadgeColor(result.recommendation)} text-sm px-3 py-1`}>
              {result.recommendation}
            </span>
          </div>

          <p className="text-gray-700 mb-4">{result.summary}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <h4 className="font-medium text-green-700 mb-2 flex items-center gap-1">
                <CheckCircle size={16} /> Strengths
              </h4>
              <ul className="space-y-1">
                {(result.strengths || []).map((s, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">•</span> {s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-red-700 mb-2 flex items-center gap-1">
                <XCircle size={16} /> Gaps
              </h4>
              <ul className="space-y-1">
                {(result.gaps || []).map((g, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span> {g}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {onSave && (
            <div className="border-t border-gray-100 pt-4">
              <p className="text-sm text-gray-500 mb-3">
                Save this applicant to the selected job posting's Applications tab.
              </p>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex items-center gap-2 disabled:opacity-60"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? 'Saving...' : 'Save to Applications'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
