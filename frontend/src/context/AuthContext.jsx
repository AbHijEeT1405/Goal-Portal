import { createContext, useContext, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('user')); } catch { return null; }
  });

  const login = async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    window.__authToken = data.token;
    sessionStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    window.__authToken = null;
    sessionStorage.removeItem('user');
    setUser(null);
  };

  // Restore token on page load
  if (user && !window.__authToken) {
    // Re-login required on refresh (no localStorage available in sandbox)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);