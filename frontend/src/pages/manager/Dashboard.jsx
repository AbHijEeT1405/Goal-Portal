import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Users, CheckSquare } from 'lucide-react';

export default function ManagerDashboard() {
  const { user } = useAuth();
  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Welcome, {user?.name}</h1>
      <p className="text-sm text-gray-500 mb-8">FY 2026–27 · Manager Portal</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/manager/team-goals"
          className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-teal-50 rounded-lg flex items-center justify-center">
              <Users size={18} className="text-teal-600" />
            </div>
            <p className="font-semibold text-gray-800">Team Goals</p>
          </div>
          <p className="text-sm text-gray-500">Review, edit, approve, or return goal sheets submitted by your team.</p>
        </Link>

        <Link to="/manager/team-checkins"
          className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
              <CheckSquare size={18} className="text-blue-600" />
            </div>
            <p className="font-semibold text-gray-800">Team Check-ins</p>
          </div>
          <p className="text-sm text-gray-500">View quarterly progress and add structured comments per goal.</p>
        </Link>
      </div>
    </div>
  );
}