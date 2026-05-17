import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Save, CheckSquare } from 'lucide-react';

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

export default function TeamCheckinsPage() {
  const [quarter, setQuarter] = useState('Q1');
  const [data, setData] = useState([]);
  const [comments, setComments] = useState({});
  const [saving, setSaving] = useState({});
  const [messages, setMessages] = useState({});

  useEffect(() => {
    api.get(`/checkins/team?quarter=${quarter}`).then(setData).catch(console.error);
  }, [quarter]);

  const saveComment = async (checkinId) => {
    setSaving(s => ({ ...s, [checkinId]: true }));
    try {
      await api.put(`/checkins/${checkinId}/comment`, { comment: comments[checkinId] });
      setMessages(m => ({ ...m, [checkinId]: '✅ Saved' }));
      api.get(`/checkins/team?quarter=${quarter}`).then(setData);
    } catch (e) {
      setMessages(m => ({ ...m, [checkinId]: e.error || 'Error' }));
    } finally {
      setSaving(s => ({ ...s, [checkinId]: false }));
    }
  };

  const scoreColor = (score) => {
    if (score == null) return 'text-gray-400';
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-orange-500';
    return 'text-red-500';
  };

  const statusBadge = (s) => {
    const map = {
      not_started: 'bg-gray-100 text-gray-500',
      on_track: 'bg-blue-100 text-blue-600',
      completed: 'bg-green-100 text-green-600',
    };
    const label = { not_started: 'Not Started', on_track: 'On Track', completed: 'Completed' };
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[s] || 'bg-gray-100 text-gray-400'}`}>{label[s] || '—'}</span>;
  };

  // Group by employee
  const grouped = data.reduce((acc, row) => {
    const key = row.employee_name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {});

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Team Check-ins</h1>
      <p className="text-sm text-gray-500 mb-5">Review progress and add comments for your team.</p>

      <div className="flex gap-2 mb-6">
        {QUARTERS.map(q => (
          <button key={q} onClick={() => setQuarter(q)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              quarter === q ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {q}
          </button>
        ))}
      </div>

      {Object.keys(grouped).length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">No check-in data found for {quarter}.</p>
        </div>
      )}

      {Object.entries(grouped).map(([empName, rows]) => (
        <div key={empName} className="mb-8">
          <p className="font-semibold text-gray-700 mb-3">{empName}</p>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">Goal</th>
                  <th className="px-4 py-3 text-left">UoM</th>
                  <th className="px-4 py-3 text-right">Target</th>
                  <th className="px-4 py-3 text-right">Actual</th>
                  <th className="px-4 py-3 text-right">Score</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Your Comment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800 max-w-[200px]">
                      <p className="truncate">{row.title}</p>
                      <p className="text-xs text-gray-400">{row.thrust_area}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{row.uom_type}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{row.target ?? '—'}</td>
                    <td className="px-4 py-3 text-right text-gray-700 font-medium">{row.actual_achievement ?? '—'}</td>
                    <td className={`px-4 py-3 text-right font-bold ${scoreColor(row.progress_score)}`}>
                      {row.progress_score != null ? `${row.progress_score}%` : '—'}
                    </td>
                    <td className="px-4 py-3">{statusBadge(row.progress_status)}</td>
                    <td className="px-4 py-3">
                      {row.checkin_id ? (
                        <div className="flex items-center gap-2">
                          <input
                            value={comments[row.checkin_id] !== undefined ? comments[row.checkin_id] : (row.manager_comment || '')}
                            onChange={e => setComments(c => ({ ...c, [row.checkin_id]: e.target.value }))}
                            placeholder="Add comment..."
                            className="border border-gray-200 rounded-lg px-2 py-1 text-xs w-36 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                          <button
                            onClick={() => saveComment(row.checkin_id)}
                            disabled={saving[row.checkin_id]}
                            className="p-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
                          >
                            <Save size={12} />
                          </button>
                          {messages[row.checkin_id] && (
                            <span className="text-xs text-green-600">{messages[row.checkin_id]}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">No check-in yet</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}