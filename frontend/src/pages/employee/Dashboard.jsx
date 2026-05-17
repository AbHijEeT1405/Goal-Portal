import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { Target, CheckSquare } from 'lucide-react';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Welcome, {user?.name}</h1>
      <p className="text-sm text-gray-500 mb-8">FY 2026–27 · Employee Portal</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/employee/goals"
          className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-teal-50 rounded-lg flex items-center justify-center">
              <Target size={18} className="text-teal-600" />
            </div>
            <p className="font-semibold text-gray-800">My Goals</p>
          </div>
          <p className="text-sm text-gray-500">Create, edit, and submit your annual goal sheet for manager approval.</p>
        </Link>

        <Link to="/employee/checkin"
          className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
              <CheckSquare size={18} className="text-blue-600" />
            </div>
            <p className="font-semibold text-gray-800">Quarterly Check-in</p>
          </div>
          <p className="text-sm text-gray-500">Log actual achievements against your targets for each quarter.</p>
        </Link>
      </div>
    </div>
  );
}