import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/axios';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Developer' | 'sadmin';
  avatar?: string;
  github_username?: string;
  onboarded: boolean;
  onboarding_type?: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  completeOAuth: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updateTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem('accessToken')
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      if (accessToken) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
        } catch (err) {
          logout();
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, [accessToken]);

  const login = async (credentials: any) => {
    const res = await api.post('/auth/login', credentials);
    localStorage.setItem('accessToken', res.data.accessToken);
    localStorage.setItem('refreshToken', res.data.refreshToken);
    setAccessToken(res.data.accessToken);

    // Fetch full profile to get onboarding status
    const profileRes = await api.get('/auth/me');
    setUser(profileRes.data);
  };

  const register = async (data: any) => {
    await api.post('/auth/register', data);
  };

  const completeOAuth = async (at: string, rt: string) => {
    setIsLoading(true);
    try {
      localStorage.setItem('accessToken', at);
      localStorage.setItem('refreshToken', rt);
      setAccessToken(at);

      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch (err) {
      console.error('OAuth sync failed:', err);
      logout();
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setAccessToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch (err) {
      console.error('Profile refresh failed:', err);
    }
  };

  const updateTokens = async (at: string, rt: string) => {
    localStorage.setItem('accessToken', at);
    localStorage.setItem('refreshToken', rt);
    setAccessToken(at);
    
    // Refresh user state with new token payload
    const res = await api.get('/auth/me');
    setUser(res.data);
  };

  return (
    <AuthContext.Provider value={{
      user,
      accessToken,
      login,
      register,
      completeOAuth,
      logout,
      refreshProfile,
      updateTokens,
      isLoading,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};