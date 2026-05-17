import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Users, CheckSquare, Clock } from 'lucide-react';

export default function ManagerDashboard() {
  const { user } = useAuth();
  return (
    <div>
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 mb-6 text-white">
        <p className="text-purple-100 text-sm mb-1">Manager View 👔</p>
        <h1 className="text-2xl font-bold">{user?.name}</h1>
        <p className="text-purple-100 text-sm mt-1">FY 2026–27 · L1 Manager Portal</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { to: '/manager/team-goals', icon: Users, color: 'bg-brand-500', light: 'bg-brand-50', tc: 'text-brand-600', title: 'Team Goals', desc: 'Review, edit, approve or return goal sheets submitted by your team.', tag: 'Pending Review' },
          { to: '/manager/team-checkins', icon: CheckSquare, color: 'bg-blue-500', light: 'bg-blue-50', tc: 'text-blue-600', title: 'Team Check-ins', desc: 'View quarterly progress and add structured feedback per goal.', tag: 'Q1 Active' },
        ].map(({ to, icon: Icon, color, light, tc, title, desc, tag }) => (
          <Link key={to} to={to} className="card-hover p-5 group flex flex-col gap-4 no-underline">
            <div className="flex items-start justify-between">
              <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center shadow-card`}>
                <Icon size={18} className="text-white" />
              </div>
              <span className={`text-[0.68rem] font-medium px-2.5 py-1 rounded-full ${light} ${tc}`}>{tag}</span>
            </div>
            <div>
              <p className="font-semibold text-ink mb-1">{title}</p>
              <p className="text-sm text-ink-faint leading-relaxed">{desc}</p>
            </div>
            <p className={`text-xs font-medium ${tc} group-hover:underline`}>Open →</p>
          </Link>
        ))}
      </div>
    </div>
  );
}