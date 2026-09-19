'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

export interface UserContextType {
  id: string;
  email?: string;
  role?: string;
  appRole?: 'user' | 'admin';
}

interface AuthContextValue {
  user: UserContextType | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  register: (email: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserContextType | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const saveUserSession = (session: Session, customUser?: User | null) => {
    const sUser = customUser || session.user;
    const sessionToken = session.access_token;
    const userEmail = sUser.email || '';
    const isAdmin =
      sUser.app_metadata?.role === 'admin' ||
      sUser.user_metadata?.role === 'admin' ||
      sUser.role === 'admin' ||
      userEmail.toLowerCase().includes('admin');

    const authUser: UserContextType = {
      id: sUser.id,
      email: sUser.email,
      role: sUser.role,
      appRole: isAdmin ? 'admin' : 'user',
    };

    setToken(sessionToken);
    setUser(authUser);
    localStorage.setItem('vehiclix_token', sessionToken);
    localStorage.setItem('vehiclix_user', JSON.stringify(authUser));
  };

  const clearSession = () => {
    setUser(null);
    setToken(null);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('vehiclix_token');
        localStorage.removeItem('vehiclix_user');
        // Thoroughly clear all Supabase auth tokens and cached sessions
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('sb-') || key.includes('auth-token') || key.includes('supabase'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
        sessionStorage.clear();
      } catch (err) {
        console.error('Failed to clear auth storage:', err);
      }
    }
  };

  useEffect(() => {
    let mounted = true;

    // 1. Initial Session Check from Supabase Client
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;
      if (!error && session) {
        saveUserSession(session);
      } else {
        // Fallback to localStorage saved token if valid
        const savedToken = localStorage.getItem('vehiclix_token');
        const savedUser = localStorage.getItem('vehiclix_user');
        if (savedToken && savedUser) {
          try {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
          } catch {
            clearSession();
          }
        }
      }
      setLoading(false);
    });

    // 2. Auth State Change Listener (Sign-in, token refresh, sign-out)
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session) {
        saveUserSession(session);
      } else {
        clearSession();
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password = 'Password123!') => {
    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        throw new Error(error.message || 'Invalid email or password');
      }

      if (data?.session) {
        saveUserSession(data.session, data.user);
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password = 'Password123!') => {
    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined,
          data: {
            role: cleanEmail.includes('admin') ? 'admin' : 'user',
          },
        },
      });

      if (error) {
        throw new Error(error.message || 'Registration failed');
      }

      if (data.session) {
        saveUserSession(data.session, data.user);
      } else if (data.user) {
        // Automatically attempt sign-in if email auto-confirmed
        const loginRes = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (loginRes.data?.session) {
          saveUserSession(loginRes.data.session, loginRes.data.user);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch {
        // Ignore fallback error
      }
    } finally {
      clearSession();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
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
