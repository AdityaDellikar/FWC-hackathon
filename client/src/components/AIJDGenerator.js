'use client';
import { useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Wand2, Loader2, CheckCircle } from 'lucide-react';

export default function AIJDGenerator({ onUseJD }) {
  const [form, setForm] = useState({ jobTitle: '', department: '', keySkills: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!form.jobTitle || !form.department) return toast.error('Job title and department required');
    setLoading(true);
    try {
      const res = await api.post('/api/ai/generate-jd', {
        jobTitle: form.jobTitle,
        department: form.department,
        keySkills: form.keySkills.split(',').map(s => s.trim()).filter(Boolean),
      });
      setResult(res.data);
      toast.success('Job description generated');
    } catch {
      toast.error('Failed to generate JD');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
          <input
            value={form.jobTitle}
            onChange={e => setForm(p => ({ ...p, jobTitle: e.target.value }))}
            placeholder="e.g. Senior Software Engineer"
            className="input-field"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
          <input
            value={form.department}
            onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
            placeholder="e.g. Engineering"
            className="input-field"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Key Skills (comma-separated)</label>
        <input
          value={form.keySkills}
          onChange={e => setForm(p => ({ ...p, keySkills: e.target.value }))}
          placeholder="e.g. React, Node.js, MongoDB, AWS"
          className="input-field"
        />
      </div>
      <button onClick={generate} disabled={loading} className="btn-primary flex items-center gap-2 disabled:opacity-60">
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
        {loading ? 'Generating...' : 'Generate JD with AI'}
      </button>

      {result && (
        <div className="card border-2 border-indigo-100 bg-indigo-50/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{result.title}</h3>
            <button onClick={() => onUseJD && onUseJD(result)} className="btn-primary flex items-center gap-2 text-sm">
              <CheckCircle size={15} /> Use this JD
            </button>
          </div>
          <p className="text-gray-700 mb-4">{result.overview}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Responsibilities</h4>
              <ul className="space-y-1">
                {(result.responsibilities || []).map((r, i) => (
                  <li key={i} className="text-sm text-gray-600 flex gap-2"><span className="text-indigo-500">→</span>{r}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Requirements</h4>
              <ul className="space-y-1">
                {(result.requirements || []).map((r, i) => (
                  <li key={i} className="text-sm text-gray-600 flex gap-2"><span className="text-indigo-500">•</span>{r}</li>
                ))}
              </ul>
            </div>
          </div>
          {result.benefits && result.benefits.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-gray-800 mb-2">Benefits</h4>
              <div className="flex flex-wrap gap-2">
                {result.benefits.map((b, i) => (
                  <span key={i} className="badge bg-green-100 text-green-700">{b}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
