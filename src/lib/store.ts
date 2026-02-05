import { create } from 'zustand';
import type { User } from './types';

interface AppState {
    user: User | null;
    setUser: (user: User | null) => void;
    logout: () => void;
    defaultCommission: number;
    setDefaultCommission: (rate: number) => void;
    selectedBusinessId: string | null; // For the "Negocio" selection step
    setSelectedBusinessId: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
    user: null, // Start with no user
    setUser: (user) => set({ user }),
    logout: () => set({ user: null }),
    defaultCommission: 0.07,
    setDefaultCommission: (rate) => set({ defaultCommission: rate }),
    selectedBusinessId: null,
    setSelectedBusinessId: (id) => set({ selectedBusinessId: id }),
}));
