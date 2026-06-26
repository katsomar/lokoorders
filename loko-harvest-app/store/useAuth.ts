import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'store_manager' | 'sales_accounts' | 'driver' | 'production_manager' | 'order_manager';
  status: 'active' | 'inactive' | 'pending' | 'suspended' | 'rejected';
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}

// Safe localStorage wrapper to prevent SecurityError or ReferenceError on mobile devices/incognito tabs
const safeLocalStorage: StateStorage = {
  getItem: (name: string): string | null => {
    try {
      if (typeof window === 'undefined') return null;
      return window.localStorage.getItem(name);
    } catch (e) {
      console.warn("Storage item fetch failed:", e);
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(name, value);
      }
    } catch (e) {
      console.warn("Storage item set failed:", e);
    }
  },
  removeItem: (name: string): void => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(name);
      }
    } catch (e) {
      console.warn("Storage item removal failed:", e);
    }
  },
};

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        try {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('token', token);
          }
        } catch (e) {
          console.warn(e);
        }
        set({ user, token });
      },
      clearAuth: () => {
        try {
          if (typeof window !== 'undefined') {
            window.localStorage.removeItem('token');
          }
        } catch (e) {
          console.warn(e);
        }
        set({ user: null, token: null });
      },
    }),
    {
      name: 'loko-auth-storage',
      storage: createJSONStorage(() => safeLocalStorage),
    }
  )
);
