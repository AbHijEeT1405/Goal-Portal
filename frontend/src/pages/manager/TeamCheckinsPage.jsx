import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Save } from 'lucide-react';

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
const statusBadge  = { not_started: 'badge-not-started', on_track: 'badge-on-track', completed: 'badge-completed' };
const statusLabel  = { not_started: 'Not Started', on_track: 'On Track', completed: 'Completed' };
const scoreClass   = (s) => s == null ? 'score-null' : s >= 80 ? 'score-high' : s >= 50 ? 'score-mid' : 'score-low';

export default function TeamCheckinsPage() {
  const [quarter, setQuarter]   = useState('Q1');
  const [data, setData]         = useState([]);
  const [comments, setComments] = useState({});
  const [saving, setSaving]     = useState({});
  const [messages, setMessages] = useState({});

  useEffect(() => { api.get(`/checkins/team?quarter=${quarter}`).then(setData).catch(console.error); }, [quarter]);

  const saveComment = async (checkinId) => {
    setSaving(s => ({ ...s, [checkinId]: true }));
    try {
      await api.put(`/checkins/${checkinId}/comment`, { comment: comments[checkinId] });
      setMessages(m => ({ ...m, [checkinId]: 'saved' }));
      api.get(`/checkins/team?quarter=${quarter}`).then(setData);
    } catch { setMessages(m => ({ ...m, [checkinId]: 'error' })); }
    finally { setSaving(s => ({ ...s, [checkinId]: false })); }
  };

  const grouped = data.reduce((acc, row) => {
    if (!acc[row.employee_name]) acc[row.employee_name] = [];
    acc[row.employee_name].push(row); return acc;
  }, {});

  return (
    <div>
      <div className="page-hdr">
        <div>
          <h1 className="page-title">Team Check-ins</h1>
          <p className="page-sub">Review progress and add comments.</p>
        </div>
      </div>
      <div className="flex gap-2 mb-6 flex-wrap">
        {QUARTERS.map(q => <button key={q} className={`q-tab${quarter === q ? ' active' : ''}`} onClick={() => setQuarter(q)}>{q}</button>)}
      </div>
      {Object.keys(grouped).length === 0 && (
        <div className="card-p empty-state"><p className="font-medium text-ink-muted">No check-in data for {quarter}.</p></div>
      )}
      {Object.entries(grouped).map(([empName, rows]) => (
        <div key={empName} className="mb-8">
          <p className="font-semibold text-ink mb-3">{empName}</p>
          {/* Desktop table */}
          <div className="table-wrap hidden md:block">
            <table>
              <thead>
                <tr>
                  <th>Goal</th><th>UoM</th><th className="right">Target</th>
                  <th className="right">Actual</th><th className="right">Score</th>
                  <th>Status</th><th>Comment</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i}>
                    <td>
                      <p className="font-medium text-ink text-sm">{row.title}</p>
                      <p className="text-xs text-ink-faint">{row.thrust_area}</p>
                    </td>
                    <td><span className="text-xs uppercase font-medium text-ink-faint">{row.uom_type}</span></td>
                    <td className="right tabular-nums">{row.target ?? '—'}</td>
                    <td className="right font-semibold tabular-nums">{row.actual_achievement ?? '—'}</td>
                    <td className={`right ${scoreClass(row.progress_score)}`}>{row.progress_score != null ? `${row.progress_score}%` : '—'}</td>
                    <td><span className={`badge ${statusBadge[row.progress_status] || 'badge-draft'}`}>{statusLabel[row.progress_status] || '—'}</span></td>
                    <td>
                      {row.checkin_id ? (
                        <div className="flex items-center gap-2">
                          <input className="form-input text-xs py-1.5 px-2.5" style={{ width: '140px' }}
                            value={comments[row.checkin_id] !== undefined ? comments[row.checkin_id] : (row.manager_comment || '')}
                            onChange={e => setComments(c => ({ ...c, [row.checkin_id]: e.target.value }))}
                            placeholder="Add comment..." />
                          <button className="btn btn-primary btn-icon" onClick={() => saveComment(row.checkin_id)} disabled={saving[row.checkin_id]}>
                            <Save size={12} />
                          </button>
                          {messages[row.checkin_id] === 'saved' && <span className="text-xs text-green-600">✅</span>}
                        </div>
                      ) : <span className="text-xs text-ink-faint">No check-in yet</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {rows.map((row, i) => (
              <div key={i} className="card-p space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-ink text-sm">{row.title}</p>
                    <p className="text-xs text-ink-faint mt-0.5">{row.thrust_area} · {row.uom_type}</p>
                  </div>
                  {row.progress_score != null && (
                    <span className={`text-lg font-bold ${scoreClass(row.progress_score)}`}>{row.progress_score}%</span>
                  )}
                </div>
                <div className="flex gap-4 text-xs">
                  <span>Target: <b className="text-ink">{row.target ?? '—'}</b></span>
                  <span>Actual: <b className="text-ink">{row.actual_achievement ?? '—'}</b></span>
                </div>
                {row.checkin_id && (
                  <div className="flex items-center gap-2">
                    <input className="form-input text-xs py-1.5 flex-1"
                      value={comments[row.checkin_id] !== undefined ? comments[row.checkin_id] : (row.manager_comment || '')}
                      onChange={e => setComments(c => ({ ...c, [row.checkin_id]: e.target.value }))}
                      placeholder="Add comment..." />
                    <button className="btn btn-primary btn-sm" onClick={() => saveComment(row.checkin_id)} disabled={saving[row.checkin_id]}>
                      <Save size={12} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}