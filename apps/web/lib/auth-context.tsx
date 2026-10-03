'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserProfile } from '@lifedesk/types';
import { apiClient } from './api-client';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updatedData: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Keep a ref so apiClient can always read the latest token without
  // being re-created on every render (avoids the stale-closure issue).
  const tokenRef = useRef<string | null>(null);

  /** Persist token to both state and localStorage in one call */
  const persistToken = (newToken: string | null) => {
    tokenRef.current = newToken;
    setToken(newToken);
    if (newToken) {
      localStorage.setItem('lifedesk_token', newToken);
    } else {
      localStorage.removeItem('lifedesk_token');
    }
  };

  /** Clear all session state and go to login */
  const clearSession = () => {
    persistToken(null);
    setUser(null);
    router.push('/login');
  };

  useEffect(() => {
    const handleUnauthorized = () => {
      clearSession();
    };
    window.addEventListener('lifedesk:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('lifedesk:unauthorized', handleUnauthorized);
    };
  }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem('lifedesk_token');
    if (!savedToken) {
      setIsLoading(false);
      return;
    }

    // Hydrate token ref immediately so apiClient can use it for /auth/me
    tokenRef.current = savedToken;
    setToken(savedToken);

    apiClient<UserProfile>('/auth/me', {}, tokenRef)
      .then((userData) => {
        setUser(userData);
      })
      .catch((err) => {
        // If token is expired/invalid, clear session silently
        if (err?.status === 401) {
          persistToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = async (email: string, password: string) => {
    const data = await apiClient<{ accessToken: string; user: UserProfile }>(
      '/auth/login',
      { method: 'POST', body: { email, password } },
    );
    persistToken(data.accessToken);
    setUser(data.user);
    router.push('/dashboard');
  };

  const register = async (name: string, email: string, password: string) => {
    const data = await apiClient<{ accessToken: string; user: UserProfile }>(
      '/auth/register',
      { method: 'POST', body: { name, email, password } },
    );
    persistToken(data.accessToken);
    setUser(data.user);
    router.push('/dashboard');
  };

  const logout = () => {
    clearSession();
  };

  const updateUser = (updatedData: Partial<UserProfile>) => {
    setUser((prev) => (prev ? { ...prev, ...updatedData } : null));
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
