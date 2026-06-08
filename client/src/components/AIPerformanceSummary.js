'use client';
import { useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Sparkles, Loader2 } from 'lucide-react';

export default function AIPerformanceSummary({ employeeName, rating, goals, achievements, managerNotes, onSummaryGenerated }) {
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!employeeName) return toast.error('Employee name required');
    if (!rating) return toast.error('Rating required');
    setLoading(true);
    try {
      const res = await api.post('/api/ai/performance-summary', {
        employeeName,
        rating,
        goals: Array.isArray(goals) ? goals : goals?.split('\n').filter(Boolean) || [],
        achievements: Array.isArray(achievements) ? achievements : achievements?.split('\n').filter(Boolean) || [],
        managerNotes: managerNotes || '',
      });
      onSummaryGenerated(res.data.summary);
      toast.success('AI summary generated');
    } catch {
      toast.error('Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={generate}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium disabled:opacity-60"
    >
      {loading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
      {loading ? 'Generating...' : '✨ Generate AI Summary'}
    </button>
  );
}
