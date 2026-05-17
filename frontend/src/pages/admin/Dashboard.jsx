import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Link } from 'react-router-dom';
import { Settings, FileText, Shield, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function AdminDashboard() {
  const [completion, setCompletion] = useState([]);

  useEffect(() => {
    api.get('/reports/completion').then(setCompletion).catch(console.error);
  }, []);

  const totalEmployees = completion.length;
  const fullyLocked = completion.filter(r => parseInt(r.locked_goals) > 0).length;
  const pending = completion.filter(r => parseInt(r.submitted_goals) > 0).length;

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Admin Dashboard</h1>
      <p className="text-sm text-gray-500 mb-6">FY 2026–27 · HR / Admin Portal</p>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-400 mb-1">Total Employees</p>
          <p className="text-3xl font-bold text-gray-800">{totalEmployees}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-400 mb-1">Goals Locked</p>
          <p className="text-3xl font-bold text-teal-600">{fullyLocked}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-400 mb-1">Awaiting Approval</p>
          <p className="text-3xl font-bold text-orange-500">{pending}</p>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-4 mb-8">
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
              if (locked > 0) statusEl = <span className="flex items-center gap-1 text-xs text-teal-600"><CheckCircle size={12}/> Locked</span>;
              else if (submitted > 0) statusEl = <span className="flex items-center gap-1 text-xs text-blue-500"><Clock size={12}/> Pending</span>;
              else statusEl = <span className="flex items-center gap-1 text-xs text-gray-400"><AlertCircle size={12}/> Draft</span>;
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
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400 text-sm">No employee data found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}