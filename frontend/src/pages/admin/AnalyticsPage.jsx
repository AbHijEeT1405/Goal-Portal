import { useEffect, useState } from 'react';
import api from '../../services/api';
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell,
  LineChart, Line,
} from 'recharts';

const COLORS = ['#0f766e', '#0891b2', '#7c3aed', '#f59e0b'];

export default function AnalyticsPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/reports/analytics').then(setData).catch(console.error);
  }, []);

  if (!data) return <div>Loading analytics...</div>;

  const { kpis, byQuarter, byStatus } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Analytics Dashboard</h1>
        <p className="page-sub">Quarterly goal and check-in insights.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Employees" value={kpis.total_employees} />
        <KpiCard label="Locked Goals" value={kpis.locked_goals} />
        <KpiCard label="Check-ins" value={kpis.total_checkins} />
        <KpiCard label="Avg Score" value={`${kpis.avg_score}%`} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="font-semibold mb-4">Check-ins by Quarter</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={byQuarter}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="quarter" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#0f766e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold mb-4">Status Breakdown</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={byStatus} dataKey="count" nameKey="status" outerRadius={100} label>
                  {byStatus.map((entry, index) => (
                    <Cell key={entry.status} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold mb-4">Average Score Trend</h3>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={byQuarter}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="quarter" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="avg_score" stroke="#0891b2" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value }) {
  return (
    <div className="card p-5">
      <p className="text-sm text-ink-faint">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}