import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus, Pencil, Trash2, Send, AlertCircle, Target } from 'lucide-react';

const UOM_TYPES = ['min', 'max', 'timeline', 'zero'];
const THRUST_AREAS = ['Sales', 'Operations', 'Customer Experience', 'Quality', 'Safety', 'Finance', 'HR', 'Technology'];

const emptyGoal = { thrust_area: '', title: '', description: '', uom_type: 'min', target: '', deadline: '', weightage: '' };

export default function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyGoal);
  const [error, setError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const totalWeight = goals.filter(g => ['draft','returned'].includes(g.status))
    .reduce((s, g) => s + parseFloat(g.weightage || 0), 0);
  const draftGoals = goals.filter(g => ['draft','returned'].includes(g.status));
  const lockedGoals = goals.filter(g => ['locked','approved','submitted'].includes(g.status));

  useEffect(() => { fetchGoals(); }, []);

  const fetchGoals = async () => {
    try { setGoals(await api.get('/goals/my')); }
    catch (e) { console.error(e); }
  };

  const openAdd = () => { setEditing(null); setForm(emptyGoal); setError(''); setShowForm(true); };
  const openEdit = (g) => { setEditing(g.id); setForm({ ...g }); setError(''); setShowForm(true); };

  const handleSave = async () => {
    setError('');
    if (!form.thrust_area || !form.title || !form.uom_type || !form.weightage)
      return setError('Fill all required fields');
    if (parseFloat(form.weightage) < 10)
      return setError('Minimum weightage is 10%');
    try {
      setLoading(true);
      if (editing) await api.put(`/goals/${editing}`, form);
      else await api.post('/goals', form);
      setShowForm(false);
      fetchGoals();
    } catch (e) { setError(e.error || 'Save failed'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this goal?')) return;
    await api.delete(`/goals/${id}`);
    fetchGoals();
  };

  const handleSubmit = async () => {
    setSubmitError('');
    try {
      await api.post('/goals/submit');
      fetchGoals();
    } catch (e) { setSubmitError(e.error || 'Submit failed'); }
  };

  const statusBadge = (s) => {
    const map = { draft: 'bg-gray-100 text-gray-600', submitted: 'bg-blue-100 text-blue-700',
      approved: 'bg-green-100 text-green-700', locked: 'bg-teal-100 text-teal-700',
      returned: 'bg-orange-100 text-orange-700' };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[s] || ''}`}>{s}</span>;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">My Goals</h1>
          <p className="text-sm text-gray-500 mt-0.5">FY 2026–27 Goal Sheet</p>
        </div>
        {draftGoals.length < 8 && (
          <button onClick={openAdd} className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700">
            <Plus size={15} /> Add Goal
          </button>
        )}
      </div>

      {/* Weightage bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Total Weightage (Draft)</span>
          <span className={`font-semibold ${Math.round(totalWeight) === 100 ? 'text-green-600' : 'text-orange-600'}`}>
            {totalWeight.toFixed(0)}% / 100%
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${Math.round(totalWeight) === 100 ? 'bg-green-500' : 'bg-teal-500'}`}
            style={{ width: `${Math.min(totalWeight, 100)}%` }}
          />
        </div>
        {submitError && (
          <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
            <AlertCircle size={14} /> {submitError}
          </div>
        )}
        {draftGoals.length > 0 && (
          <button onClick={handleSubmit}
            className="mt-3 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            <Send size={14} /> Submit for Approval
          </button>
        )}
      </div>

      {/* Goals list */}
      <div className="space-y-3">
        {goals.map(g => (
          <div key={g.id} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {statusBadge(g.status)}
                  <span className="text-xs text-gray-400">{g.thrust_area}</span>
                </div>
                <p className="font-medium text-gray-800 text-sm">{g.title}</p>
                {g.description && <p className="text-xs text-gray-500 mt-0.5">{g.description}</p>}
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  <span>UoM: <b>{g.uom_type}</b></span>
                  <span>Target: <b>{g.target || '—'}</b></span>
                  <span>Weight: <b>{g.weightage}%</b></span>
                </div>
                {g.manager_comment && (
                  <div className="mt-2 p-2 bg-orange-50 rounded text-xs text-orange-700">
                    💬 Manager: {g.manager_comment}
                  </div>
                )}
              </div>
              {['draft','returned'].includes(g.status) && (
                <div className="flex gap-2 ml-4">
                  <button onClick={() => openEdit(g)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(g.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded">
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {goals.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Target size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No goals yet. Add your first goal.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit Goal' : 'Add Goal'}</h2>
            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600">Thrust Area *</label>
                <select value={form.thrust_area} onChange={e => setForm(f => ({ ...f, thrust_area: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1">
                  <option value="">Select...</option>
                  {THRUST_AREAS.map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Goal Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" placeholder="e.g. Achieve ₹50L revenue" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600">UoM Type *</label>
                  <select value={form.uom_type} onChange={e => setForm(f => ({ ...f, uom_type: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1">
                    {UOM_TYPES.map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Target</label>
                  <input type="number" value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600">Deadline</label>
                  <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">Weightage (%) *</label>
                  <input type="number" min="10" max="100" value={form.weightage}
                    onChange={e => setForm(f => ({ ...f, weightage: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={loading} className="flex-1 bg-teal-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50">
                {loading ? 'Saving...' : 'Save Goal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}