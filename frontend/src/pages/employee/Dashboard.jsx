import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Target, CheckSquare, TrendingUp, Clock } from 'lucide-react';

const cards = [
  {
    to: '/employee/goals', icon: Target, color: 'bg-brand-500',
    light: 'bg-brand-50', textColor: 'text-brand-600',
    title: 'My Goals',
    desc: 'Create, edit, and submit your annual goal sheet for manager approval.',
    tag: 'Goal Setting Open'
  },
  {
    to: '/employee/checkin', icon: CheckSquare, color: 'bg-blue-500',
    light: 'bg-blue-50', textColor: 'text-blue-600',
    title: 'Quarterly Check-in',
    desc: 'Log actual achievements against your targets for each quarter.',
    tag: 'Q1 Active'
  },
];

export default function EmployeeDashboard() {
  const { user } = useAuth();
  return (
    <div>
      {/* Hero greeting */}
      <div className="bg-gradient-to-r from-brand-500 to-brand-600 rounded-2xl p-6 mb-6 text-white">
        <p className="text-brand-100 text-sm mb-1">Good day 👋</p>
        <h1 className="text-2xl font-bold">{user?.name}</h1>
        <p className="text-brand-100 text-sm mt-1">FY 2026–27 · Employee Portal</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map(({ to, icon: Icon, color, light, textColor, title, desc, tag }) => (
          <Link key={to} to={to}
            className="card-hover p-5 group flex flex-col gap-4 no-underline">
            <div className="flex items-start justify-between">
              <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center shadow-card`}>
                <Icon size={18} className="text-white" />
              </div>
              <span className={`text-[0.68rem] font-medium px-2.5 py-1 rounded-full ${light} ${textColor}`}>{tag}</span>
            </div>
            <div>
              <p className="font-semibold text-ink mb-1">{title}</p>
              <p className="text-sm text-ink-faint leading-relaxed">{desc}</p>
            </div>
            <p className={`text-xs font-medium ${textColor} group-hover:underline`}>Open →</p>
          </Link>
        ))}
      </div>

      {/* Info strip */}
      <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <Clock size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-800">Current Phase: Goal Setting</p>
          <p className="text-xs text-amber-600 mt-0.5">Submit all goals before the deadline for manager review and approval.</p>
        </div>
      </div>
    </div>
  );
}