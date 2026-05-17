import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Download } from 'lucide-react';

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];

export default function ReportsPage() {
  const [data, setData] = useState([]);
  const [quarter, setQuarter] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await api.get(`/reports/achievement${quarter ? `?quarter=${quarter}` : ''}`);
      setData(result);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [quarter]);

  const exportCSV = () => {
    const base = import.meta.env.VITE_API_BASE_URL;
    const token = window.__authToken;
    const url = `${base}/reports/achievement?format=csv${quarter ? `&quarter=${quarter}` : ''}`;
    // Open with token in query (simplest approach without fetch blob)
    window.open(`${url}&token=${token}`, '_blank');
  };

  const scoreColor = (score) => {
    if (score == null) return 'text-gray-400';
    if (score >= 80) return 'text-green-600 font-bold';
    if (score >= 50) return 'text-orange-500 font-semibold';
    return 'text-red-500 font-semibold';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Achievement Report</h1>
          <p className="text-sm text-gray-500 mt-0.5">Planned Target vs. Actual Achievement for all employees.</p>
        </div>
        <button onClick={exportCSV}
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700">
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Quarter filter */}
      <div className="flex gap-2 mb-5">
        <button onClick={() => setQuarter('')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${!quarter ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          All
        </button>
        {QUARTERS.map(q => (
          <button key={q} onClick={() => setQuarter(q)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${quarter === q ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {q}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left">Employee</th>
              <th className="px-4 py-3 text-left">Dept</th>
              <th className="px-4 py-3 text-left">Thrust Area</th>
              <th className="px-4 py-3 text-left">Goal</th>
              <th className="px-4 py-3 text-left">UoM</th>
              <th className="px-4 py-3 text-right">Weight</th>
              <th className="px-4 py-3 text-right">Target</th>
              <th className="px-4 py-3 text-right">Actual</th>
              <th className="px-4 py-3 text-right">Score</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Quarter</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr><td colSpan={11} className="px-4 py-10 text-center text-gray-400 text-sm">Loading...</td></tr>
            )}
            {!loading && data.map((r, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{r.employee}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{r.department}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{r.thrust_area}</td>
                <td className="px-4 py-3 text-gray-700 max-w-[180px]"><p className="truncate">{r.title}</p></td>
                <td className="px-4 py-3 text-xs text-gray-400 uppercase">{r.uom_type}</td>
                <td className="px-4 py-3 text-right text-gray-500 text-xs">{r.weightage}%</td>
                <td className="px-4 py-3 text-right text-gray-600">{r.target ?? '—'}</td>
                <td className="px-4 py-3 text-right text-gray-700">{r.actual_achievement ?? '—'}</td>
                <td className={`px-4 py-3 text-right ${scoreColor(r.progress_score)}`}>
                  {r.progress_score != null ? `${r.progress_score}%` : '—'}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full capitalize">
                    {r.progress_status?.replace('_', ' ') || '—'}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">{r.quarter || '—'}</td>
              </tr>
            ))}
            {!loading && data.length === 0 && (
              <tr><td colSpan={11} className="px-4 py-10 text-center text-gray-400 text-sm">No data found for the selected filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}