import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Target, Eye, EyeOff } from 'lucide-react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../authConfig';

const DEMO = [
  { role: 'Employee', email: 'employee@atomberg.com', password: 'employee123', color: 'bg-brand-50 border-brand-200 text-brand-700' },
  { role: 'Manager',  email: 'manager@atomberg.com',  password: 'manager123',  color: 'bg-purple-50 border-purple-200 text-purple-700' },
  { role: 'Admin',    email: 'admin@atomberg.com',     password: 'admin123',    color: 'bg-orange-50 border-orange-200 text-orange-700' },
];

export default function LoginPage() {
  const { login, loginWithMicrosoft } = useAuth();
  const { instance } = useMsal();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(
        user.role === 'employee' ? '/employee/dashboard' :
        user.role === 'manager'  ? '/manager/dashboard'  : '/admin/dashboard'
      );
    } catch (err) {
      setError(err.error || 'Login failed. Check your credentials.');
    } finally { setLoading(false); }
  };

  const handleMicrosoftLogin = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await instance.loginPopup(loginRequest);
      const email =response.account?.username;

      if (!email) {
        throw new Error('Microsoft account email not found.');
      }

      const user = await loginWithMicrosoft(email);

      navigate(
        user.role === 'employee' ? '/employee/dashboard' :
        user.role === 'manager'  ? '/manager/dashboard'  : '/admin/dashboard'
      );
    } catch (err) {
      setError(err.message || err.error || 'Microsoft sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (d) => setForm({ email: d.email, password: d.password });

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-surface to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-2xl bg-brand-500 flex items-center justify-center shadow-lift">
            <Target size={20} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-lg text-ink leading-none">Goal Portal</p>
            <p className="text-xs text-ink-faint">Atomberg Technologies</p>
          </div>
        </div>

        <div className="card shadow-lift overflow-hidden">
          <div className="bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-5">
            <h1 className="text-white font-semibold text-lg">Welcome back</h1>
            <p className="text-brand-100 text-sm mt-0.5">FY 2026–27 Performance Cycle</p>
          </div>

          <div className="p-6">
            {error && <div className="alert alert-error mb-4">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label form-label-required">Email</label>
                <input
                  type="email" required
                  className="form-input"
                  placeholder="you@atomberg.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div>
                <label className="form-label form-label-required">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'} required
                    className="form-input pr-10"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  />
                  <button type="button" onClick={() => setShowPw(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink transition-colors">
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="btn btn-primary w-full justify-center py-2.5 text-sm font-semibold">
                {loading ? 'Signing in...' : 'Sign in →'}
              </button>
              <button
                type="button"
                onClick={handleMicrosoftLogin}
                disabled={loading}
                className="btn w-full justify-center py-2.5 text-sm font-semibold border border-surface-border mt-3"
              >
                Sign in with Microsoft
              </button>
            </form>

            {/* Demo credentials */}
            {/* <div className="mt-6 pt-5 border-t border-surface-border">
              <p className="text-xs font-medium text-ink-faint mb-3 text-center uppercase tracking-wider">Quick login — Demo accounts</p>
              <div className="grid grid-cols-3 gap-2">
                {DEMO.map(d => (
                  <button key={d.role} onClick={() => fillDemo(d)}
                    className={`border rounded-xl px-3 py-2 text-xs font-medium transition-all hover:shadow-card ${d.color}`}>
                    {d.role}
                  </button>
                ))}
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}