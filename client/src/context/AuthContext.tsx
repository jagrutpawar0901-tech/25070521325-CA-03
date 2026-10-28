import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  quickSwitchDemo: (role: 'admin' | 'doctor' | 'patient' | 'nurse' | 'pharmacist' | 'billing') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_CREDENTIALS: Record<string, { email: string; pass: string }> = {
  admin: { email: 'admin@swasthyaos.com', pass: 'Admin@123' },
  doctor: { email: 'dr.sharma@swasthyaos.com', pass: 'Doctor@123' },
  patient: { email: 'patient.rahul@swasthyaos.com', pass: 'Patient@123' },
  nurse: { email: 'nurse.anita@swasthyaos.com', pass: 'Nurse@123' },
  pharmacist: { email: 'pharma@swasthyaos.com', pass: 'Pharma@123' },
  billing: { email: 'billing@swasthyaos.com', pass: 'Billing@123' }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('swasthya_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('swasthya_token');
  });
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, password = 'Password@123'): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        const userData = res.data.data.user || res.data.data;
        const authToken = res.data.data.token || res.data.token;
        setUser(userData);
        setToken(authToken);
        localStorage.setItem('swasthya_user', JSON.stringify(userData));
        if (authToken) localStorage.setItem('swasthya_token', authToken);
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Login error:', err.response?.data?.message || err.message);
      throw new Error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const quickSwitchDemo = async (role: 'admin' | 'doctor' | 'patient' | 'nurse' | 'pharmacist' | 'billing') => {
    const creds = DEMO_CREDENTIALS[role];
    if (creds) {
      await login(creds.email, creds.pass);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('swasthya_user');
    localStorage.removeItem('swasthya_token');
    api.post('/auth/logout').catch(() => {});
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        quickSwitchDemo
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
