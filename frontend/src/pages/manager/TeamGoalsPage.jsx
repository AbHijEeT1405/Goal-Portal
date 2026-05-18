import { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  CheckCircle,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Users,
  AlertTriangle
} from 'lucide-react';

const statusBadge = {
  draft: 'badge-draft',
  submitted: 'badge-submitted',
  approved: 'badge-approved',
  locked: 'badge-locked',
  returned: 'badge-returned'
};

export default function TeamGoalsPage() {
  const [goals, setGoals] = useState([]);
  const [comments, setComments] = useState({});
  const [messages, setMessages] = useState({});
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchGoals(); }, []);

  const fetchGoals = async () =>
    api.get('/goals/team').then(setGoals).catch(console.error);

  const toggle = (id) =>
    setExpanded(e => ({ ...e, [id]: !e[id] }));

  const doAction = async (id, type) => {
    setLoading(true);
    setMessages(m => ({ ...m, [id]: '' }));
    try {
      await api.put(`/goals/${id}/${type}`, { comment: comments[id] || '' });
      setMessages(m => ({ ...m, [id]: type === 'approve' ? 'approved' : 'returned' }));
      await fetchGoals();
    } catch (e) {
      setMessages(m => ({ ...m, [id]: e.error || 'Failed' }));
    } finally {
      setLoading(false);
    }
  };

  const grouped = goals.reduce((acc, g) => {
    if (!acc[g.employee_name]) acc[g.employee_name] = [];
    acc[g.employee_name].push(g);
    return acc;
  }, {});

  if (Object.keys(grouped).length === 0) {
    return (
      <div>
        <div className="page-hdr">
          <h1 className="page-title">Team Goals</h1>
        </div>
        <div className="card-p empty-state">
          <Users size={40} style={{ opacity: 0.2 }} />
          <p className="font-medium text-ink-muted">No team goals found.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-hdr">
        <div>
          <h1 className="page-title">Team Goals</h1>
          <p className="page-sub">Review and approve your team's submitted goal sheets.</p>
        </div>
      </div>

      {Object.entries(grouped).map(([empName, empGoals]) => {
        const totalW = empGoals.reduce((s, g) => s + parseFloat(g.weightage || 0), 0);
        const hasPending = empGoals.some(g => g.status === 'submitted');
        const hasEscalated = empGoals.some(g => g.is_escalated);

        return (
          <div key={empName} className="mb-8">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <p className="font-semibold text-ink">{empName}</p>
                <p className="text-xs text-ink-faint">
                  {empGoals.length} goals · Total weight: {totalW}%
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {hasPending && <span className="badge badge-submitted">Awaiting Review</span>}
                {hasEscalated && (
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                    <AlertTriangle size={12} />
                    Escalated
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {empGoals.map(g => (
                <div key={g.id} className="card overflow-hidden">
                  <div
                    className="flex items-center justify-between gap-3 p-4 cursor-pointer hover:bg-surface-soft transition-colors"
                    onClick={() => toggle(g.id)}
                  >
                    <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                      <span className={`badge ${statusBadge[g.status] || 'badge-draft'}`}>
                        {g.status}
                      </span>

                      {g.is_escalated && (
                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                          <AlertTriangle size={12} />
                          Escalated
                        </span>
                      )}

                      <p className="font-medium text-ink text-sm truncate">{g.title}</p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-ink-faint font-medium">{g.weightage}%</span>
                      {expanded[g.id]
                        ? <ChevronUp size={14} className="text-ink-faint" />
                        : <ChevronDown size={14} className="text-ink-faint" />}
                    </div>
                  </div>

                  {expanded[g.id] && (
                    <div className="border-t border-surface-border px-4 py-4">
                      {g.is_escalated && (
                        <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700">
                          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium">Escalated approval</p>
                            <p className="text-red-600">
                              This goal has remained pending manager approval beyond the escalation threshold.
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                        {[
                          ['Thrust Area', g.thrust_area],
                          ['UoM', g.uom_type],
                          ['Target', g.target ?? '—'],
                          ['Deadline', g.deadline ? g.deadline.split('T')[0] : '—']
                        ].map(([l, v]) => (
                          <div key={l}>
                            <p className="text-[0.65rem] uppercase tracking-wider text-ink-faint">{l}</p>
                            <p className="text-sm font-medium text-ink mt-0.5">{v}</p>
                          </div>
                        ))}
                      </div>

                      {g.description && (
                        <p className="text-sm text-ink-muted mb-4">{g.description}</p>
                      )}

                      {g.status === 'submitted' && (
                        <div className="bg-surface-soft border border-surface-border rounded-xl p-4">
                          <label className="form-label">Comment (optional)</label>
                          <input
                            className="form-input mb-3"
                            value={comments[g.id] || ''}
                            placeholder="Add feedback for employee..."
                            onChange={e => setComments(c => ({ ...c, [g.id]: e.target.value }))}
                          />

                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              className="btn btn-success"
                              onClick={() => doAction(g.id, 'approve')}
                              disabled={loading}
                            >
                              <CheckCircle size={13} /> Approve & Lock
                            </button>

                            <button
                              className="btn btn-warning"
                              onClick={() => doAction(g.id, 'return')}
                              disabled={loading}
                            >
                              <RotateCcw size={13} /> Return for Rework
                            </button>

                            {messages[g.id] === 'approved' && (
                              <span className="text-xs text-green-600 font-medium">
                                Approved and locked
                              </span>
                            )}

                            {messages[g.id] === 'returned' && (
                              <span className="text-xs text-orange-600 font-medium">
                                Returned to employee
                              </span>
                            )}

                            {messages[g.id] && !['approved', 'returned'].includes(messages[g.id]) && (
                              <span className="text-xs text-red-600">{messages[g.id]}</span>
                            )}
                          </div>
                        </div>
                      )}

                      {g.manager_comment && g.status !== 'submitted' && (
                        <div className="flex items-start gap-2 p-3 bg-orange-50 rounded-xl text-sm text-orange-700">
                          <span>💬</span> Your comment: {g.manager_comment}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}