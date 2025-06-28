'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiClient } from '../config/api';

interface User {
  id: number;
  username: string;
  email: string | null;
  role: string;
  firstName: string;
  lastName: string;
  phone: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (username: string, password: string) => {
    try {
      const data = await apiClient.login(username, password);

      // Set user data from response
      setUser(data.user);
      return data.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Reset user state regardless of server response
      setUser(null);
    }
  };

  const fetchUser = async () => {
    try {
      // Only try to fetch user if we have a token
      const token = localStorage.getItem('auth-token');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const userData = await apiClient.getCurrentUser() as User;
      setUser(userData);
    } catch (error) {
      // Don't log authentication errors as they're expected when not logged in
      if (error instanceof Error && error.message.includes('Authentication required')) {
        // Silently handle authentication errors
        setUser(null);
      } else {
        console.error('Fetch user error:', error);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const value = {
    user,
    loading,
    login,
    logout,
    fetchUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 