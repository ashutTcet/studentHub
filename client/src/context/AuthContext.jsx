import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const activateUserSession = (activeUser) => {
    if (!activeUser?._id) return;
    localStorage.setItem('studenthub.userId', activeUser._id);
    api.startSync(activeUser._id);
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.user || null);
      if (response.user) {
        activateUserSession(response.user);
      }
      return response.user || null;
    } catch (error) {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (payload) => {
    const response = await api.post('/auth/login', payload);
    setUser(response.user);
    activateUserSession(response.user);
    return response;
  };

  const register = async (payload) => {
    const response = await api.post('/auth/register', payload);
    setUser(response.user);
    activateUserSession(response.user);
    return response;
  };

  const logout = async () => {
    const currentUserId = localStorage.getItem('studenthub.userId');
    try {
      await api.post('/auth/logout', {});
    } finally {
      if (currentUserId) {
        await api.clearOfflineDataForUser(currentUserId);
      }
      localStorage.removeItem('studenthub.userId');
      api.startSync(null);
      setUser(null);
    }
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      fetchCurrentUser,
      login,
      register,
      logout,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};
