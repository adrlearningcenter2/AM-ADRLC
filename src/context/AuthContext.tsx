/**
 * Authentication Context for AM Digital ADR V2
 * Handles login, session persistence, role checks, and instant demo switching.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/adr';
import { ApiService } from '../services/apiService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isOperator: boolean;
  login: (nip: string, password?: string) => Promise<void>;
  logout: () => void;
  switchDemoRole: (nip: string) => Promise<void>;
  reloadUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'am_digital_adr_auth_session';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const restore = async () => {
      try {
        const saved = sessionStorage.getItem(AUTH_STORAGE_KEY);
        if (!saved) return;
        const parsed = JSON.parse(saved);
        if (!parsed.token || !parsed.user) return;
        // Revalidate the token on the server; never trust a cached role alone.
        await ApiService.getOverview(parsed.token);
        setUser(parsed.user);
        setToken(parsed.token);
      } catch {
        sessionStorage.removeItem(AUTH_STORAGE_KEY);
      } finally { setReady(true); }
    };
    restore();
  }, []);

  const login = async (nip: string, password?: string) => {
    const res = await ApiService.login(nip, password || '');
    setUser(res.user);
    setToken(res.token);
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: res.user, token: res.token }));
  };

  const logout = () => {
    if (token) {
      ApiService.logout(token).catch(console.error);
    }
    setUser(null);
    setToken(null);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const switchDemoRole = async (_targetNip: string) => {
    throw new Error('Pergantian role tanpa login dinonaktifkan pada sistem LIVE.');
  };
  const reloadUser = () => { /* User data is controlled by the backend. */ };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ADMIN',
        isOperator: user?.role === 'OPERATOR',
        login,
        logout,
        switchDemoRole,
        reloadUser,
      }}
    >
      {ready ? children : <div className="p-8 text-center">Memverifikasi sesi...</div>}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
