import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Shield } from 'lucide-react';

const actionStyle = {
  created: 'bg-blue-50 text-blue-600',
  updated: 'bg-yellow-50 text-yellow-600',
  submitted: 'bg-purple-50 text-purple-600',
  approved: 'bg-green-50 text-green-600',
  returned: 'bg-orange-50 text-orange-600',
  unlocked: 'bg-red-50 text-red-600',
};

export default function AuditPage() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    api.get('/reports/audit?limit=200').then(setLogs).catch(console.error);
  }, []);

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Audit Log</h1>
      <p className="text-sm text-gray-500 mb-6">Every change made to goals after the lock date is recorded here.</p>

      {logs.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Shield size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No audit logs yet.</p>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Timestamp</th>
              <th className="px-4 py-3 text-left">Changed By</th>
              <th className="px-4 py-3 text-left">Goal</th>
              <th className="px-4 py-3 text-left">Action</th>
              <th className="px-4 py-3 text-left">Field</th>
              <th className="px-4 py-3 text-left">Change</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map(l => (
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                  {new Date(l.changed_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </td>
                <td className="px-4 py-3 font-medium text-gray-700">{l.changed_by_name}</td>
                <td className="px-4 py-3 text-gray-600 max-w-[180px]">
                  <p className="truncate text-xs">{l.goal_title || '—'}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${actionStyle[l.action] || 'bg-gray-100 text-gray-500'}`}>
                    {l.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">{l.field_changed || '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {l.old_value && l.new_value
                    ? <span><span className="line-through text-red-400">{l.old_value}</span> → <span className="text-green-600">{l.new_value}</span></span>
                    : l.new_value || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}