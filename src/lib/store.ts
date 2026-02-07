import { create } from 'zustand';
import type { User } from './types';

interface AppState {
    user: User | null;
    setUser: (user: User | null) => void;
    logout: () => void;
    defaultCommission: number;
    setDefaultCommission: (rate: number) => void;
    selectedBusinessId: string | null;
    setSelectedBusinessId: (id: string | null) => void;

    // Auth Session
    session: any | null; // typing 'any' for now to avoid circular deps with supabase-js types if strict
    setSession: (session: any | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
    user: null, // Start with no user
    setUser: (user) => set({ user }),
    logout: () => set({ user: null, session: null }),
    defaultCommission: 0.07,
    setDefaultCommission: (rate) => set({ defaultCommission: rate }),
    selectedBusinessId: null,
    setSelectedBusinessId: (id) => set({ selectedBusinessId: id }),
    session: null,
    setSession: (session) => set({ session }),
}));
