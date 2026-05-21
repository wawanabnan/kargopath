import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, saveAuth, clearAuth, getUser, getAccessToken } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(getUser);
  const [loading, setLoading] = useState(true);

  // Verify token on mount
  useEffect(() => {
    const verify = async () => {
      if (getAccessToken()) {
        try {
          const profile = await authAPI.getProfile();
          setUser(profile);
        } catch {
          clearAuth();
          setUser(null);
        }
      }
      setLoading(false);
    };
    verify();
  }, []);

  const login = async (email, password) => {
    const data = await authAPI.login(email, password);
    saveAuth({ access: data.access, refresh: data.refresh, user: data.user });
    setUser(data.user);
    return data.user;
  };

  const refreshUser = async () => {
    try {
      const profile = await authAPI.getProfile();
      setUser(profile);
      localStorage.setItem('user', JSON.stringify(profile));
    } catch {}
  };
  const register = async (formData) => {
    await authAPI.register(formData);
    // Auto-login after register
    return login(formData.email, formData.password);
  };

  const logout = () => {
    clearAuth();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
