import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User } from '../types';
import api from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, companyName?: string) => Promise<void>;
  registerOrg: (data: { companyName: string; companyDomain?: string; name: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Normalize the user object so that `id` is always populated.
// The backend JWT payload and /me response use `userId`, but the frontend
// User type declares `id` as required.
function normalizeUser(raw: any): User {
  return { ...raw, id: raw.id || raw.userId };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('assetorbit_token'));
  const [loading, setLoading] = useState<boolean>(true);
  // Track whether token was set by login (skip re-fetch in that case)
  const skipNextMeCall = useRef(false);

  // On initial mount only — restore session from stored token
  useEffect(() => {
    const storedToken = localStorage.getItem('assetorbit_token');
    if (!storedToken) {
      setLoading(false);
      return;
    }

    // Set header before making the call
    api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;

    api.get('/auth/me')
      .then(res => {
        setUser(normalizeUser(res.data.user));
      })
      .catch((err) => {
        console.warn('Session restore failed, clearing token:', err?.response?.status);
        localStorage.removeItem('assetorbit_token');
        delete api.defaults.headers.common['Authorization'];
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []); // Only on mount

  const login = async (email: string, password: string, companyName?: string) => {
    const res = await api.post('/auth/login', { email, password, companyName });
    const newToken = res.data.token;
    const newUser = normalizeUser(res.data.user);

    localStorage.setItem('assetorbit_token', newToken);
    // Set the axios default header immediately
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(newUser); // Set user directly from login response — no extra /me call needed
  };

  const registerOrg = async (data: { companyName: string; companyDomain?: string; name: string; email: string; password: string }) => {
    const res = await api.post('/auth/register-org', data);
    const newToken = res.data.token;
    const newUser = normalizeUser(res.data.user);

    localStorage.setItem('assetorbit_token', newToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('assetorbit_token');
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, registerOrg, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
