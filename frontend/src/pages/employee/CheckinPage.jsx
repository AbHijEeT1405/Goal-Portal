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
    api
      .get(`/checkins/my?quarter=${quarter}`)
      .then(setGoals)
      .catch(console.error);
  }, [quarter]);

  const handleSubmit = async (goal, form) => {
    const goalKey = goal.goal_id;

    setSaving((s) => ({ ...s, [goalKey]: true }));
    setMessages((m) => ({ ...m, [goalKey]: '' }));

    try {
      await api.post('/checkins', {
        goal_id: goal.goal_id,
        quarter,
        ...form,
      });

      setMessages((m) => ({ ...m, [goalKey]: 'saved' }));

      const refreshed = await api.get(`/checkins/my?quarter=${quarter}`);
      setGoals(refreshed);
    } catch (e) {
      setMessages((m) => ({
        ...m,
        [goalKey]: e.error || 'Failed',
      }));
    } finally {
      setSaving((s) => ({ ...s, [goalKey]: false }));
    }
  };

  return (
    <div>
      <div className="page-hdr">
        <div>
          <h1 className="page-title">Quarterly Check-in</h1>
          <p className="page-sub">Log actual achievements for your locked goals.</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {QUARTERS.map((q) => (
          <button
            key={q}
            className={`q-tab${quarter === q ? ' active' : ''}`}
            onClick={() => setQuarter(q)}
          >
            {q}
          </button>
        ))}
      </div>

      {goals.length === 0 && (
        <div className="card-p empty-state">
          <CheckSquare size={40} style={{ opacity: 0.2 }} />
          <div>
            <p className="font-medium text-ink-muted">No locked goals</p>
            <p className="text-sm mt-1">
              Goals must be approved and locked before check-in.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {goals.map((g) => (
          <GoalCheckinCard
            key={g.goal_id || g.title}
            goal={g}
            onSubmit={handleSubmit}
            saving={saving[g.goal_id]}
            message={messages[g.goal_id]}
          />
        ))}
      </div>
    </div>
  );
}

function GoalCheckinCard({ goal, onSubmit, saving, message }) {
  const [form, setForm] = useState({
    actual_achievement: goal.actual_achievement ?? '',
    completion_date: goal.completion_date
      ? goal.completion_date.split('T')[0]
      : '',
    progress_status: goal.progress_status || 'not_started',
  });

  const score = goal.progress_score;
  const scoreClass =
    score == null
      ? 'score-null'
      : score >= 80
      ? 'score-high'
      : score >= 50
      ? 'score-mid'
      : 'score-low';

  return (
    <div className="card overflow-hidden">
      <div className="flex items-start justify-between gap-4 p-5 pb-4">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-ink text-sm">{goal.title}</p>
          <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-ink-faint">
            <span>{goal.thrust_area}</span>
            <span>
              UoM: <span className="font-medium text-ink-muted">{goal.uom_type}</span>
            </span>
            <span>
              Target:{' '}
              <span className="font-medium text-ink-muted">
                {goal.target ?? '—'}
              </span>
            </span>
            <span>
              Weight:{' '}
              <span className="font-medium text-ink-muted">
                {goal.weightage}%
              </span>
            </span>
          </div>
        </div>

        {score != null && (
          <div className="flex-shrink-0 text-right bg-surface-muted rounded-xl px-4 py-2">
            <p className="text-[0.65rem] text-ink-faint uppercase tracking-wider">
              Score
            </p>
            <p className={`text-xl mt-0.5 ${scoreClass}`}>{score}%</p>
          </div>
        )}
      </div>

      <div className="border-t border-surface-border px-5 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="form-label">Actual Achievement</label>
            <input
              type="number"
              className="form-input"
              value={form.actual_achievement}
              onChange={(e) =>
                setForm((f) => ({ ...f, actual_achievement: e.target.value }))
              }
              placeholder="Enter value"
            />
          </div>

          <div>
            <label className="form-label">Completion Date</label>
            <input
              type="date"
              className="form-input"
              value={form.completion_date}
              onChange={(e) =>
                setForm((f) => ({ ...f, completion_date: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={form.progress_status}
              onChange={(e) =>
                setForm((f) => ({ ...f, progress_status: e.target.value }))
              }
            >
              <option value="not_started">Not Started</option>
              <option value="on_track">On Track</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {goal.manager_comment && (
          <div className="mb-3 flex items-start gap-2 p-3 bg-blue-50 rounded-xl text-sm text-blue-700">
            <span className="flex-shrink-0">💬</span>
            <span>Manager: {goal.manager_comment}</span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            className="btn btn-primary"
            onClick={() => onSubmit(goal, form)}
            disabled={saving}
          >
            <Save size={13} /> {saving ? 'Saving...' : 'Save Check-in'}
          </button>

          {message === 'saved' && (
            <span className="text-xs text-green-600 font-medium">✅ Saved</span>
          )}

          {message && message !== 'saved' && (
            <span className="text-xs text-red-600">{message}</span>
          )}
        </div>
      </div>
    </div>
  );
}