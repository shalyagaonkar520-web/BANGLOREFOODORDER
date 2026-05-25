import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AdminUser } from '../types';

interface AdminState {
  user: AdminUser | null;
  setUser: (user: AdminUser | null) => void;
  logout: () => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    {
      name: 'admin-storage',
    }
  )
);
