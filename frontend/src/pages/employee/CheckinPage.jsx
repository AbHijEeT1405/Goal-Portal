import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Save, CheckSquare } from 'lucide-react';

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

export default function CheckinPage() {
  const [quarter, setQuarter] = useState('Q1');
  const [goals, setGoals] = useState([]);
  const [saving, setSaving] = useState({});
  const [messages, setMessages] = useState({});

  useEffect(() => {
    api.get(`/checkins/my?quarter=${quarter}`).then(setGoals).catch(console.error);
  }, [quarter]);

  const handleSubmit = async (goal, form) => {
    setSaving(s => ({ ...s, [goal.id]: true }));
    setMessages(m => ({ ...m, [goal.id]: '' }));
    try {
      await api.post('/checkins', {
        goal_id: goal.id,
        quarter,
        actual_achievement: form.actual_achievement,
        completion_date: form.completion_date || null,
        progress_status: form.progress_status,
      });
      setMessages(m => ({ ...m, [goal.id]: '✅ Saved successfully' }));
      api.get(`/checkins/my?quarter=${quarter}`).then(setGoals);
    } catch (e) {
      setMessages(m => ({ ...m, [goal.id]: e.error || 'Failed to save' }));
    } finally {
      setSaving(s => ({ ...s, [goal.id]: false }));
    }
  };

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Quarterly Check-in</h1>
      <p className="text-sm text-gray-500 mb-5">Log your actual achievements for each locked goal.</p>

      {/* Quarter selector */}
      <div className="flex gap-2 mb-6">
        {QUARTERS.map(q => (
          <button key={q} onClick={() => setQuarter(q)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              quarter === q
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {q}
          </button>
        ))}
      </div>

      {goals.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <CheckSquare size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No locked goals found. Goals must be approved before check-in.</p>
        </div>
      )}

      <div className="space-y-4">
        {goals.map(g => (
          <GoalCheckinCard
            key={g.id || g.title}
            goal={g}
            onSubmit={handleSubmit}
            saving={saving[g.id]}
            message={messages[g.id]}
          />
        ))}
      </div>
    </div>
  );
}

function GoalCheckinCard({ goal, onSubmit, saving, message }) {
  const [form, setForm] = useState({
    actual_achievement: goal.actual_achievement ?? '',
    completion_date: goal.completion_date ? goal.completion_date.split('T')[0] : '',
    progress_status: goal.progress_status || 'not_started',
  });

  const scoreColor = goal.progress_score >= 80
    ? 'text-green-600' : goal.progress_score >= 50
    ? 'text-orange-500' : 'text-red-500';

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-medium text-gray-800">{goal.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {goal.thrust_area} · UoM: <span className="font-medium">{goal.uom_type}</span> · Target: <span className="font-medium">{goal.target ?? '—'}</span> · Weight: <span className="font-medium">{goal.weightage}%</span>
          </p>
        </div>
        {goal.progress_score != null && (
          <div className="text-right">
            <p className="text-xs text-gray-400">Progress Score</p>
            <p className={`text-2xl font-bold ${scoreColor}`}>{goal.progress_score}%</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Actual Achievement</label>
          <input
            type="number"
            value={form.actual_achievement}
            onChange={e => setForm(f => ({ ...f, actual_achievement: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="Enter actual value"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Completion Date</label>
          <input
            type="date"
            value={form.completion_date}
            onChange={e => setForm(f => ({ ...f, completion_date: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
          <select
            value={form.progress_status}
            onChange={e => setForm(f => ({ ...f, progress_status: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="not_started">Not Started</option>
            <option value="on_track">On Track</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {goal.manager_comment && (
        <div className="mb-3 px-3 py-2 bg-blue-50 rounded-lg text-xs text-blue-700">
          💬 <span className="font-medium">Manager:</span> {goal.manager_comment}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={() => onSubmit(goal, form)}
          disabled={saving}
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors"
        >
          <Save size={14} />
          {saving ? 'Saving...' : 'Save Check-in'}
        </button>
        {message && (
          <span className={`text-xs ${message.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>
            {message}
          </span>
        )}
      </div>
    </div>
  );
}