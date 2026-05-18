import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Link } from 'react-router-dom';
import {
  Settings,
  FileText,
  Shield,
  CheckCircle,
  Clock,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';

export default function AdminDashboard() {
  const [completion, setCompletion] = useState([]);
  const [escalations, setEscalations] = useState([]);
  const [runningEscalationCheck, setRunningEscalationCheck] = useState(false);

  useEffect(() => {
    api.get('/reports/completion').then(setCompletion).catch(console.error);
    api.get('/goals/admin/escalations').then(setEscalations).catch(console.error);
  }, []);

  const refreshEscalations = () => {
    api.get('/goals/admin/escalations').then(setEscalations).catch(console.error);
  };

  const runEscalationCheck = async () => {
    try {
      setRunningEscalationCheck(true);
      await api.post('/goals/admin/escalations/run');
      refreshEscalations();
    } catch (err) {
      console.error(err);
    } finally {
      setRunningEscalationCheck(false);
    }
  };

  const totalEmployees = completion.length;
  const toNum = (v) => Number(v) || 0;

  const fullyLocked = completion.filter(r =>
    toNum(r.locked_goals) > 0 &&
    toNum(r.submitted_goals) === 0 &&
    toNum(r.draft_goals) === 0
  ).length;

  const pending = completion.filter(r => parseInt(r.submitted_goals) > 0).length;
  const escalatedCount = escalations.length;

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Admin Dashboard</h1>
      <p className="text-sm text-gray-500 mb-6">FY 2026–27 · HR / Admin Portal</p>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-400 mb-1">Total Employees</p>
          <p className="text-3xl font-bold text-gray-800">{totalEmployees}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-400 mb-1">Fully Locked Employees</p>
          <p className="text-3xl font-bold text-teal-600">{fullyLocked}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-400 mb-1">Awaiting Approval</p>
          <p className="text-3xl font-bold text-orange-500">{pending}</p>
        </div>

        <div className="border border-red-200 rounded-xl p-5 bg-red-50">
          <p className="text-xs text-red-500 mb-1">Escalated Goals</p>
          <p className="text-3xl font-bold text-red-600">{escalatedCount}</p>
        </div>
      </div>

      {/* Escalation panel */}
      <div className="bg-white border border-red-200 rounded-xl p-5 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center">
              <AlertTriangle size={18} className="text-red-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">Escalated Approvals</p>
              <p className="text-xs text-gray-500">
                Goals pending manager approval beyond the escalation threshold.
              </p>
            </div>
          </div>

          <button
            onClick={runEscalationCheck}
            disabled={runningEscalationCheck}
            className="px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {runningEscalationCheck ? 'Checking...' : 'Run Escalation Check'}
          </button>
        </div>

        {escalations.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-400">
            No active escalations.
          </div>
        ) : (
          <div className="space-y-3">
            {escalations.map(item => (
              <div
                key={item.escalation_id}
                className="rounded-xl border border-red-100 bg-red-50/60 px-4 py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-800">{item.title}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {item.employee_name} · {item.employee_email}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Manager: {item.manager_name || 'Unassigned'}
                    </p>
                  </div>

                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                    <AlertTriangle size={12} />
                    Escalated
                  </span>
                </div>

                <p className="text-sm text-red-700 mt-3">{item.message}</p>

                <p className="text-xs text-gray-500 mt-2">
                  Escalated at: {new Date(item.escalated_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link to="/admin/cycles" className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
          <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center mb-3">
            <Settings size={18} className="text-purple-600" />
          </div>
          <p className="font-semibold text-gray-800">Cycle Config</p>
          <p className="text-xs text-gray-500 mt-1">Manage goal setting and check-in windows</p>
        </Link>

        <Link to="/admin/reports" className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
          <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center mb-3">
            <FileText size={18} className="text-blue-600" />
          </div>
          <p className="font-semibold text-gray-800">Reports</p>
          <p className="text-xs text-gray-500 mt-1">Achievement reports and CSV export</p>
        </Link>

        <Link to="/admin/audit" className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
          <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center mb-3">
            <Shield size={18} className="text-orange-600" />
          </div>
          <p className="font-semibold text-gray-800">Audit Log</p>
          <p className="text-xs text-gray-500 mt-1">Track every change made to goals</p>
        </Link>
      </div>

      {/* Completion table */}
      <h2 className="font-semibold text-gray-700 mb-3">Employee Completion Overview</h2>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Employee</th>
              <th className="px-4 py-3 text-left">Department</th>
              <th className="px-4 py-3 text-center">Locked</th>
              <th className="px-4 py-3 text-center">Submitted</th>
              <th className="px-4 py-3 text-center">Drafts</th>
              <th className="px-4 py-3 text-center">Check-ins</th>
              <th className="px-4 py-3 text-center">Status</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {completion.map(r => {
              const locked = parseInt(r.locked_goals);
              const submitted = parseInt(r.submitted_goals);
              const drafts = parseInt(r.draft_goals);

              let statusEl;
              if (locked > 0) {
                statusEl = (
                  <span className="flex items-center gap-1 text-xs text-teal-600">
                    <CheckCircle size={12} /> Locked
                  </span>
                );
              } else if (submitted > 0) {
                statusEl = (
                  <span className="flex items-center gap-1 text-xs text-blue-500">
                    <Clock size={12} /> Pending
                  </span>
                );
              } else {
                statusEl = (
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <AlertCircle size={12} /> Draft
                  </span>
                );
              }

              return (
                <tr key={r.email} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{r.name}</td>
                  <td className="px-4 py-3 text-gray-500">{r.department || '—'}</td>
                  <td className="px-4 py-3 text-center font-semibold text-teal-600">{locked}</td>
                  <td className="px-4 py-3 text-center font-semibold text-blue-500">{submitted}</td>
                  <td className="px-4 py-3 text-center text-gray-400">{drafts}</td>
                  <td className="px-4 py-3 text-center font-semibold text-green-600">{r.total_checkins}</td>
                  <td className="px-4 py-3 text-center">{statusEl}</td>
                </tr>
              );
            })}

            {completion.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-400 text-sm">
                  No employee data found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}