import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';



export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth(user, token) {
        set({ user, token });
      },
      clearAuth() {
        set({ user: null, token: null });
      },
      get isAuthenticated() {
        return !!get().token;
      },
    }),
    {
      name: 'htkp-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
