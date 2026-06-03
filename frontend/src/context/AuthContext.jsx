import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, saveAuth, clearAuth, getUser, getAccessToken, getTenant } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(getUser);
  const [tenant, setTenant]   = useState(getTenant);
  const [loading, setLoading] = useState(true);

  // Verify token on mount
  const fetchProfile = async () => {
    if (!getAccessToken()) return null;
    try {
      const profile = await authAPI.getProfile();
      // Merge preferred_currency from login payload if nested
      if (profile.preferred_currency || profile.profile?.preferred_currency) {
        profile.preferred_currency = profile.preferred_currency || profile.profile.preferred_currency;
      }
      return profile;
    } catch {
      clearAuth();
      setUser(null);
      setTenant(null);
      return null;
    }
  };

  useEffect(() => {
    const verify = async () => {
      if (getAccessToken()) {
        const profile = await fetchProfile();
        if (profile) setUser(profile);
      }
      setLoading(false);
    };
    verify();
  }, []);

  const saveProfile = (profile) => {
    setUser(profile);
    localStorage.setItem('user', JSON.stringify(profile));
  };

  const login = async (email, password) => {
    const data = await authAPI.login(email, password);
    saveAuth({ access: data.access, refresh: data.refresh, user: data.user, tenant: data.tenant });
    setUser(data.user);
    setTenant(data.tenant);
    // Fetch full profile to get company, profile, preferred_currency, etc.
    try {
      const profile = await fetchProfile();
      if (profile) saveProfile(profile);
    } catch {}
    return data.user;
  };

  const refreshUser = async () => {
    try {
      const profile = await fetchProfile();
      if (profile) saveProfile(profile);
    } catch {}
  };

  const register = async (formData) => {
    const data = await authAPI.register(formData);
    saveAuth({ access: data.access, refresh: data.refresh, user: data.user, tenant: data.tenant });
    setUser(data.user);
    setTenant(data.tenant);
    // Fetch full profile to get company, profile, preferred_currency, etc.
    try {
      const profile = await fetchProfile();
      if (profile) saveProfile(profile);
    } catch {}
    return data.user;
  };

  const logout = () => {
    clearAuth();
    setUser(null);
    setTenant(null);
  };

  return (
    <AuthContext.Provider value={{ user, tenant, loading, login, register, logout, refreshUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
