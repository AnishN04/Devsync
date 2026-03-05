import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/axios';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Developer' | 'Viewer';
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser]               = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem('accessToken')
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
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
    localStorage.setItem('accessToken',  res.data.accessToken);
    localStorage.setItem('refreshToken', res.data.refreshToken);
    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
  };

  const register = async (data: any) => {
    const res = await api.post('/auth/register', data);
    localStorage.setItem('accessToken',  res.data.accessToken);
    localStorage.setItem('refreshToken', res.data.refreshToken);
    setAccessToken(res.data.accessToken);
    setUser(res.data.user);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setAccessToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, login, register, logout, isLoading }}>
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