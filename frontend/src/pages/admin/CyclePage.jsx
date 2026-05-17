import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus } from 'lucide-react';

const emptyForm = { name: '', goal_setting_opens: '', q1_opens: '', q2_opens: '', q3_opens: '', q4_opens: '' };
const fields = [
  ['name', 'Cycle Name', 'text'],
  ['goal_setting_opens', 'Goal Setting Opens', 'date'],
  ['q1_opens', 'Q1 Check-in Opens', 'date'],
  ['q2_opens', 'Q2 Check-in Opens', 'date'],
  ['q3_opens', 'Q3 Check-in Opens', 'date'],
  ['q4_opens', 'Q4 / Annual Opens', 'date'],
];

export default function CyclePage() {
  const [cycles, setCycles] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    api.get('/cycles/all').then(setCycles).catch(console.error);
  }, []);

  const create = async () => {
    setMsg(''); setError('');
    if (!form.name) return setError('Cycle name is required');
    setLoading(true);
    try {
      await api.post('/cycles', form);
      setMsg('✅ New cycle created and set as active');
      setForm(emptyForm);
      setShowForm(false);
      api.get('/cycles/all').then(setCycles);
    } catch (e) {
      setError(e.error || 'Failed to create cycle');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Cycle Configuration</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage goal setting and quarterly check-in windows.</p>
        </div>
        <button onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700">
          <Plus size={15} /> New Cycle
        </button>
      </div>

      {msg && <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-lg">{msg}</div>}

      {/* Create form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 max-w-lg">
          <h2 className="font-medium text-gray-700 mb-4">Create New Cycle</h2>
          <p className="text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded mb-4">⚠️ Creating a new cycle will deactivate the current active cycle.</p>
          {error && <div className="mb-3 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
          <div className="space-y-3">
            {fields.map(([key, label, type]) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={create} disabled={loading}
                className="flex-1 bg-teal-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50">
                {loading ? 'Creating...' : 'Create Cycle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cycles list */}
      <h2 className="font-medium text-gray-700 mb-3">All Cycles</h2>
      <div className="space-y-3">
        {cycles.map(c => (
          <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-gray-800">{c.name}</p>
                  {c.is_active && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Active</span>}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1 mt-2 text-xs text-gray-500">
                  <span>Goal Setting: <b className="text-gray-700">{c.goal_setting_opens || '—'}</b></span>
                  <span>Q1: <b className="text-gray-700">{c.q1_opens || '—'}</b></span>
                  <span>Q2: <b className="text-gray-700">{c.q2_opens || '—'}</b></span>
                  <span>Q3: <b className="text-gray-700">{c.q3_opens || '—'}</b></span>
                  <span>Q4/Annual: <b className="text-gray-700">{c.q4_opens || '—'}</b></span>
                </div>
              </div>
            </div>
          </div>
        ))}
        {cycles.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">No cycles found. Create your first cycle above.</p>
        )}
      </div>
    </div>
  );
}