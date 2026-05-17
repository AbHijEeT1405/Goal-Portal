import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Target, CheckSquare, Users, Settings, BarChart2, FileText, Shield } from 'lucide-react';

const navByRole = {
  employee: [
    { to: '/employee/dashboard', label: 'Dashboard', icon: Target },
    { to: '/employee/goals', label: 'My Goals', icon: Target },
    { to: '/employee/checkin', label: 'Check-in', icon: CheckSquare },
  ],
  manager: [
    { to: '/manager/dashboard', label: 'Dashboard', icon: BarChart2 },
    { to: '/manager/team-goals', label: 'Team Goals', icon: Users },
    { to: '/manager/team-checkins', label: 'Team Check-ins', icon: CheckSquare },
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: Shield },
    { to: '/admin/cycles', label: 'Cycles', icon: Settings },
    { to: '/admin/reports', label: 'Reports', icon: FileText },
    { to: '/admin/audit', label: 'Audit Log', icon: FileText },
  ],
};

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = navByRole[user?.role] || [];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-5 border-b border-gray-200">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Atomberg</p>
          <p className="font-semibold text-gray-800 mt-1">Goal Portal</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-teal-50 text-teal-700 font-medium' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-800 truncate">{user?.name}</p>
          <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="mt-2 flex items-center gap-2 text-xs text-red-500 hover:text-red-700"
          >
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}