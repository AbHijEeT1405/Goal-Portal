import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus, Pencil, Trash2, Send, Target, ChevronDown, ChevronUp } from 'lucide-react';

const UOM_TYPES    = ['min', 'max', 'timeline', 'zero'];
const THRUST_AREAS = ['Sales', 'Operations', 'Customer Experience', 'Quality', 'Safety', 'Finance', 'HR', 'Technology'];
const emptyGoal    = { thrust_area: '', title: '', description: '', uom_type: 'min', target: '', deadline: '', weightage: '' };
const statusBadge  = { draft: 'badge-draft', submitted: 'badge-submitted', approved: 'badge-approved', locked: 'badge-locked', returned: 'badge-returned' };

export default function GoalsPage() {
  const [goals, setGoals]           = useState([]);
  const [showForm, setShowForm]     = useState(false);
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState(emptyGoal);
  const [error, setError]           = useState('');
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading]       = useState(false);
  const [expanded, setExpanded]     = useState({});

  const draftGoals  = goals.filter(g => ['draft', 'returned'].includes(g.status));
  const totalWeight = draftGoals.reduce((s, g) => s + parseFloat(g.weightage || 0), 0);
  const weightOk    = Math.round(totalWeight) === 100;
  const weightOver  = totalWeight > 100;

  useEffect(() => { fetchGoals(); }, []);
  const fetchGoals = async () => { try { setGoals(await api.get('/goals/my')); } catch (e) { console.error(e); } };

  const openAdd  = () => { setEditing(null); setForm(emptyGoal); setError(''); setShowForm(true); };
  const openEdit = (g) => { setEditing(g.id); setForm({ ...g }); setError(''); setShowForm(true); };

  const handleSave = async () => {
    setError('');
    if (!form.thrust_area || !form.title || !form.uom_type || !form.weightage) return setError('Fill all required fields');
    if (parseFloat(form.weightage) < 10) return setError('Minimum weightage is 10%');
    setLoading(true);
    try {
      editing ? await api.put(`/goals/${editing}`, form) : await api.post('/goals', form);
      setShowForm(false); fetchGoals();
    } catch (e) { setError(e.error || 'Save failed'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this goal?')) return;
    await api.delete(`/goals/${id}`).catch(console.error);
    fetchGoals();
  };

  const handleSubmit = async () => {
    setSubmitError('');
    try { await api.post('/goals/submit'); fetchGoals(); }
    catch (e) { setSubmitError(e.error || 'Submit failed'); }
  };

  return (
    <div>
      <div className="page-hdr">
        <div>
          <h1 className="page-title">My Goals</h1>
          <p className="page-sub">FY 2026–27 · {goals.length} goals · {draftGoals.length} editable</p>
        </div>
        {draftGoals.length < 8 && (
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={14} /> Add Goal
          </button>
        )}
      </div>

      {/* Weightage bar */}
      <div className="card-p mb-5">
        <div className="flex items-center justify-between text-sm mb-2.5">
          <span className="text-ink-muted font-medium">Draft Goals Weightage</span>
          <span className={`font-bold tabular-nums ${weightOk ? 'text-green-600' : weightOver ? 'text-red-600' : 'text-orange-500'}`}>
            {totalWeight.toFixed(0)}% / 100%
          </span>
        </div>
        <div className="w-full bg-surface-muted rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-2.5 rounded-full transition-all duration-500 ${weightOk ? 'bg-green-500' : weightOver ? 'bg-red-500' : 'bg-brand-500'}`}
            style={{ width: `${Math.min(totalWeight, 100)}%` }}
          />
        </div>
        {!weightOk && draftGoals.length > 0 && (
          <p className="text-xs text-orange-600 mt-2">
            {weightOver ? `Over by ${(totalWeight - 100).toFixed(0)}% — reduce weightage on some goals` : `${(100 - totalWeight).toFixed(0)}% remaining to allocate`}
          </p>
        )}
        {submitError && <div className="alert alert-error mt-3">{submitError}</div>}
        {draftGoals.length > 0 && (
          <button className="btn btn-blue mt-3" onClick={handleSubmit}>
            <Send size={13} /> Submit All for Approval
          </button>
        )}
      </div>

      {/* Goals */}
      <div className="space-y-3">
        {goals.map(g => (
          <div key={g.id} className="card overflow-hidden">
            <div
              className="p-4 flex items-start justify-between gap-3 cursor-pointer hover:bg-surface-soft transition-colors"
              onClick={() => setExpanded(e => ({ ...e, [g.id]: !e[g.id] }))}
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className={`badge ${statusBadge[g.status] || 'badge-draft'}`}>{g.status}</span>
                  <span className="text-xs text-ink-faint">{g.thrust_area}</span>
                  <span className="text-xs font-semibold text-ink-muted ml-auto">{g.weightage}%</span>
                </div>
                <p className="font-medium text-ink text-sm truncate">{g.title}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {['draft', 'returned'].includes(g.status) && (
                  <>
                    <button className="btn btn-ghost btn-icon" onClick={e => { e.stopPropagation(); openEdit(g); }}>
                      <Pencil size={13} className="text-ink-faint" />
                    </button>
                    <button className="btn btn-ghost btn-icon" onClick={e => { e.stopPropagation(); handleDelete(g.id); }}>
                      <Trash2 size={13} className="text-red-400" />
                    </button>
                  </>
                )}
                {expanded[g.id] ? <ChevronUp size={14} className="text-ink-faint" /> : <ChevronDown size={14} className="text-ink-faint" />}
              </div>
            </div>
            {expanded[g.id] && (
              <div className="px-4 pb-4 border-t border-surface-border pt-3">
                {g.description && <p className="text-sm text-ink-muted mb-3">{g.description}</p>}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[['UoM', g.uom_type], ['Target', g.target || '—'], ['Weight', `${g.weightage}%`], ['Deadline', g.deadline ? g.deadline.split('T')[0] : '—']].map(([l, v]) => (
                    <div key={l}>
                      <p className="text-[0.65rem] uppercase tracking-wider text-ink-faint">{l}</p>
                      <p className="text-sm font-medium text-ink mt-0.5">{v}</p>
                    </div>
                  ))}
                </div>
                {g.manager_comment && (
                  <div className="mt-3 flex items-start gap-2 p-3 bg-orange-50 rounded-xl text-sm text-orange-700">
                    <span className="flex-shrink-0">💬</span> {g.manager_comment}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {goals.length === 0 && (
          <div className="card-p empty-state">
            <Target size={40} style={{ opacity: 0.2 }} />
            <div>
              <p className="font-medium text-ink-muted">No goals yet</p>
              <p className="text-sm mt-1">Click "Add Goal" to define your first objective.</p>
            </div>
            <button className="btn btn-primary mt-2" onClick={openAdd}><Plus size={14}/> Add Goal</button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-ink">{editing ? 'Edit Goal' : 'New Goal'}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowForm(false)}>✕</button>
            </div>
            {error && <div className="alert alert-error mb-4">{error}</div>}
            <div className="space-y-4">
              <div>
                <label className="form-label form-label-required">Thrust Area</label>
                <select className="form-select" value={form.thrust_area} onChange={e => setForm(f => ({ ...f, thrust_area: e.target.value }))}>
                  <option value="">Select area...</option>
                  {THRUST_AREAS.map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label form-label-required">Goal Title</label>
                <input className="form-input" value={form.title} placeholder="e.g. Achieve ₹50L revenue"
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea className="form-textarea" value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label form-label-required">UoM Type</label>
                  <select className="form-select" value={form.uom_type} onChange={e => setForm(f => ({ ...f, uom_type: e.target.value }))}>
                    {UOM_TYPES.map(u => <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Target Value</label>
                  <input type="number" className="form-input" value={form.target}
                    onChange={e => setForm(f => ({ ...f, target: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Deadline</label>
                  <input type="date" className="form-input" value={form.deadline}
                    onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label form-label-required">Weightage (%)</label>
                  <input type="number" min="10" max="100" className="form-input" value={form.weightage}
                    onChange={e => setForm(f => ({ ...f, weightage: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button className="btn btn-secondary flex-1 justify-center" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary flex-1 justify-center" onClick={handleSave} disabled={loading}>
                {loading ? 'Saving...' : 'Save Goal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}