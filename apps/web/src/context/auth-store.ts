import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserProfile, UserRole } from '@inventarioapp/shared';

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (token: string, user: UserProfile) => void;
  logout: () => void;
  updateUser: (user: UserProfile) => void;
  isAdmin: () => boolean;
  isEncargado: () => boolean;
  isConsulta: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      login: (token: string, user: UserProfile) => {
        set({ token, user, isAuthenticated: true });
      },

      logout: () => {
        set({ token: null, user: null, isAuthenticated: false });
      },

      updateUser: (user: UserProfile) => {
        set({ user });
      },

      isAdmin: () => get().user?.role === UserRole.ADMIN,
      isEncargado: () => get().user?.role === UserRole.ENCARGADO,
      isConsulta: () => get().user?.role === UserRole.CONSULTA,
    }),
    {
      name: 'fatboy-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
