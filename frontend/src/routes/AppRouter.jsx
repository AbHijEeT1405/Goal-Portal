import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginPage from '../pages/LoginPage';
import EmployeeDashboard from '../pages/employee/Dashboard';
import GoalsPage from '../pages/employee/GoalsPage';
import CheckinPage from '../pages/employee/CheckinPage';
import ManagerDashboard from '../pages/manager/Dashboard';
import TeamGoalsPage from '../pages/manager/TeamGoalsPage';
import TeamCheckinsPage from '../pages/manager/TeamCheckinsPage';
import AdminDashboard from '../pages/admin/Dashboard';
import CyclePage from '../pages/admin/CyclePage';
import AuditPage from '../pages/admin/AuditPage';
import ReportsPage from '../pages/admin/ReportsPage';
import AppLayout from '../layouts/AppLayout';

function RequireAuth({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
}

function RoleHome() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'employee') return <Navigate to="/employee/dashboard" />;
  if (user.role === 'manager') return <Navigate to="/manager/dashboard" />;
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" />;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<RoleHome />} />

        {/* Employee */}
        <Route path="/employee" element={<RequireAuth roles={['employee']}><AppLayout /></RequireAuth>}>
          <Route path="dashboard" element={<EmployeeDashboard />} />
          <Route path="goals" element={<GoalsPage />} />
          <Route path="checkin" element={<CheckinPage />} />
        </Route>

        {/* Manager */}
        <Route path="/manager" element={<RequireAuth roles={['manager']}><AppLayout /></RequireAuth>}>
          <Route path="dashboard" element={<ManagerDashboard />} />
          <Route path="team-goals" element={<TeamGoalsPage />} />
          <Route path="team-checkins" element={<TeamCheckinsPage />} />
        </Route>

        {/* Admin */}
        <Route path="/admin" element={<RequireAuth roles={['admin']}><AppLayout /></RequireAuth>}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="cycles" element={<CyclePage />} />
          <Route path="audit" element={<AuditPage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}