import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import { setAccessToken } from '@/lib/api-client';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setLoading: (loading: boolean) => void;
  login: (user: User, accessToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) => set({ user }),
      setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
      setLoading: (loading) => set({ isLoading: loading }),

      login: (user, accessToken) => {
        setAccessToken(accessToken);
        set({ user, isAuthenticated: true, isLoading: false });
      },

      logout: () => {
        setAccessToken(null);
        set({ user: null, isAuthenticated: false, isLoading: false });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        // Set loading to false after hydration completes
        if (state) {
          state.setLoading(false);
        }
      },
    }
  )
);
