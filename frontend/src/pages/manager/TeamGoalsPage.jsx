import { useState, useEffect } from 'react';
import api from '../../services/api';
import { CheckCircle, RotateCcw, ChevronDown, ChevronUp, Users } from 'lucide-react';

export default function TeamGoalsPage() {
  const [goals, setGoals] = useState([]);
  const [comments, setComments] = useState({});
  const [messages, setMessages] = useState({});
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchGoals(); }, []);

  const fetchGoals = async () => {
    try { setGoals(await api.get('/goals/team')); }
    catch (e) { console.error(e); }
  };

  const doAction = async (id, type) => {
    setLoading(true);
    setMessages(m => ({ ...m, [id]: '' }));
    try {
      await api.put(`/goals/${id}/${type}`, { comment: comments[id] || '' });
      setMessages(m => ({ ...m, [id]: type === 'approve' ? '✅ Approved & Locked' : '↩️ Returned for rework' }));
      fetchGoals();
    } catch (e) {
      setMessages(m => ({ ...m, [id]: e.error || 'Action failed' }));
    } finally { setLoading(false); }
  };

  const toggle = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  // Group by employee
  const grouped = goals.reduce((acc, g) => {
    const key = g.employee_name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(g);
    return acc;
  }, {});

  const statusStyle = {
    draft: 'bg-gray-100 text-gray-600',
    submitted: 'bg-blue-100 text-blue-700',
    approved: 'bg-green-100 text-green-700',
    locked: 'bg-teal-100 text-teal-700',
    returned: 'bg-orange-100 text-orange-700',
  };

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Team Goals</h1>
      <p className="text-sm text-gray-500 mb-6">Review and approve your team's submitted goal sheets.</p>

      {Object.keys(grouped).length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No team goals found.</p>
        </div>
      )}

      {Object.entries(grouped).map(([empName, empGoals]) => {
        const totalWeight = empGoals.reduce((s, g) => s + parseFloat(g.weightage || 0), 0);
        const allSubmitted = empGoals.every(g => ['submitted','locked','approved'].includes(g.status));
        return (
          <div key={empName} className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-semibold text-gray-800">{empName}</p>
                <p className="text-xs text-gray-400">{empGoals.length} goals · Total weight: {totalWeight}%</p>
              </div>
              {allSubmitted && (
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium">Ready for review</span>
              )}
            </div>

            <div className="space-y-3">
              {empGoals.map(g => (
                <div key={g.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  {/* Header row */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => toggle(g.id)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyle[g.status] || ''}`}>
                        {g.status}
                      </span>
                      <p className="font-medium text-gray-800 text-sm">{g.title}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">{g.weightage}%</span>
                      {expanded[g.id] ? <ChevronUp size={15} className="text-gray-400" /> : <ChevronDown size={15} className="text-gray-400" />}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {expanded[g.id] && (
                    <div className="px-4 pb-4 border-t border-gray-100">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-xs text-gray-500">
                        <div><span className="block text-gray-400">Thrust Area</span><span className="font-medium text-gray-700">{g.thrust_area}</span></div>
                        <div><span className="block text-gray-400">UoM Type</span><span className="font-medium text-gray-700">{g.uom_type}</span></div>
                        <div><span className="block text-gray-400">Target</span><span className="font-medium text-gray-700">{g.target ?? '—'}</span></div>
                        <div><span className="block text-gray-400">Deadline</span><span className="font-medium text-gray-700">{g.deadline ? g.deadline.split('T')[0] : '—'}</span></div>
                      </div>
                      {g.description && (
                        <p className="mt-2 text-xs text-gray-500">{g.description}</p>
                      )}

                      {/* Manager actions for submitted goals */}
                      {g.status === 'submitted' && (
                        <div className="mt-4">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Comment (optional)</label>
                          <input
                            value={comments[g.id] || ''}
                            onChange={e => setComments(c => ({ ...c, [g.id]: e.target.value }))}
                            placeholder="Add feedback for the employee..."
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                          <div className="flex gap-2 items-center">
                            <button
                              onClick={() => doAction(g.id, 'approve')}
                              disabled={loading}
                              className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                            >
                              <CheckCircle size={14} /> Approve & Lock
                            </button>
                            <button
                              onClick={() => doAction(g.id, 'return')}
                              disabled={loading}
                              className="flex items-center gap-1.5 bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
                            >
                              <RotateCcw size={14} /> Return for Rework
                            </button>
                            {messages[g.id] && (
                              <span className={`text-xs ${messages[g.id].startsWith('✅') ? 'text-green-600' : messages[g.id].startsWith('↩️') ? 'text-orange-500' : 'text-red-500'}`}>
                                {messages[g.id]}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Show existing manager comment */}
                      {g.manager_comment && g.status !== 'submitted' && (
                        <div className="mt-3 px-3 py-2 bg-orange-50 rounded-lg text-xs text-orange-700">
                          💬 Your comment: {g.manager_comment}
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