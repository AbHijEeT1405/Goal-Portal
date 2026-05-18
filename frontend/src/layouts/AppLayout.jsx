import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LogOut, Target, CheckSquare, Users, Settings,
  BarChart2, FileText, Shield, Menu, X
} from 'lucide-react';

const navByRole = {
  employee: [
    { to: '/employee/dashboard', label: 'Dashboard',       icon: BarChart2   },
    { to: '/employee/goals',     label: 'My Goals',         icon: Target      },
    { to: '/employee/checkin',   label: 'Check-in',         icon: CheckSquare },
  ],
  manager: [
    { to: '/manager/dashboard',     label: 'Dashboard',       icon: BarChart2   },
    { to: '/manager/team-goals',    label: 'Team Goals',       icon: Users       },
    { to: '/manager/team-checkins', label: 'Team Check-ins',   icon: CheckSquare },
  ],
  admin: [
  { to: '/admin/dashboard', label: 'Dashboard', icon: Shield   },
  { to: '/admin/cycles',    label: 'Cycles',    icon: Settings },
  { to: '/admin/reports',   label: 'Reports',   icon: FileText },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
  { to: '/admin/audit',     label: 'Audit Log', icon: Shield   },
  ],
};

function SidebarContent({ user, links, onClose }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const roleColor = { employee: 'bg-brand-100 text-brand-700', manager: 'bg-purple-100 text-purple-700', admin: 'bg-orange-100 text-orange-700' };

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-surface-border flex items-center justify-between">
        <div>
          <p className="text-[0.65rem] uppercase tracking-widest text-ink-faint font-medium">Atomberg</p>
          <p className="font-semibold text-base text-ink mt-0.5">Goal Portal</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="btn btn-ghost btn-icon lg:hidden">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to} to={to}
            onClick={onClose}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-surface-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-xs flex-shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink truncate">{user?.name}</p>
            <span className={`text-[0.65rem] px-1.5 py-0.5 rounded font-medium ${roleColor[user?.role] || ''}`}>
              {user?.role}
            </span>
          </div>
        </div>
        <button
          className="flex items-center gap-2 text-xs text-red-500 hover:text-red-700 transition-colors w-full"
          onClick={() => { logout(); navigate('/login'); }}
        >
          <LogOut size={13} /> Sign out
        </button>
      </div>
    </div>
  );
}

export default function AppLayout() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const links = navByRole[user?.role] || [];

  return (
    <div className="flex h-screen overflow-hidden bg-surface-soft">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex sidebar">
        <SidebarContent user={user} links={links} />
      </aside>

      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <div className="sidebar-overlay">
          <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
          <div className="sidebar-drawer">
            <SidebarContent user={user} links={links} onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-surface border-b border-surface-border">
          <button className="btn btn-ghost btn-icon" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <p className="font-semibold text-sm text-ink">Goal Portal</p>
          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-xs">
            {user?.name?.[0]?.toUpperCase()}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}