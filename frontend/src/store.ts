import { create } from 'zustand';
import { setApiEnvironment, setApiToken } from './api';
import type { EnvironmentContext, User, View } from './types';

interface SessionState {
  user: User | null;
  token: string | null;
  view: View;
  environment: EnvironmentContext;
  setSession: (token: string, user: User) => void;
  clearSession: () => void;
  setView: (view: View) => void;
  setEnvironment: (environment: EnvironmentContext) => void;
}

const initialEnvironment: EnvironmentContext = {
  country: 'PERU', device: 'CORPORATIVO', time: '10:00', ip: '192.168.10.20'
};

export const useSession = create<SessionState>((set) => ({
  user: JSON.parse(localStorage.getItem('securedocs_user') || 'null'),
  token: localStorage.getItem('securedocs_token'),
  view: 'dashboard',
  environment: initialEnvironment,
  setSession: (token, user) => {
    localStorage.setItem('securedocs_token', token);
    localStorage.setItem('securedocs_user', JSON.stringify(user));
    setApiToken(token);
    set({ token, user });
  },
  clearSession: () => {
    localStorage.removeItem('securedocs_token');
    localStorage.removeItem('securedocs_user');
    setApiToken(null);
    set({ token: null, user: null });
  },
  setView: (view) => set({ view }),
  setEnvironment: (environment) => {
    setApiEnvironment(environment);
    set({ environment });
  }
}));

const persistedToken = localStorage.getItem('securedocs_token');
if (persistedToken) setApiToken(persistedToken);
setApiEnvironment(initialEnvironment);
