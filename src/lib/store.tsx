import React, { createContext, useContext, useMemo, useState } from 'react';
import type { Crew, User } from '@shared/types';

interface AuthState {
  user: User | null;
  crews: Crew[];
  hasProfile: boolean;
  activeCrewId: string | null;
  initData: string | null;
}

interface AuthContextValue extends AuthState {
  setAuth: (data: Partial<AuthState>) => void;
  clearAuth: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const initialState: AuthState = {
  user: null,
  crews: [],
  hasProfile: false,
  activeCrewId: null,
  initData: null
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const cached = localStorage.getItem('booze_auth');
    if (cached) {
      return JSON.parse(cached) as AuthState;
    }
    return initialState;
  });

  const setAuth = (data: Partial<AuthState>) => {
    setState((prev) => {
      const next = { ...prev, ...data };
      localStorage.setItem('booze_auth', JSON.stringify(next));
      return next;
    });
  };

  const clearAuth = () => {
    setState(initialState);
    localStorage.removeItem('booze_auth');
  };

  const value = useMemo(() => ({ ...state, setAuth, clearAuth }), [state]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('AuthProvider missing');
  }
  return ctx;
}
