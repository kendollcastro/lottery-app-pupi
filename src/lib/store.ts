import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
    session: any | null;
    setSession: (session: any | null) => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            user: null, // Start with no user
            setUser: (user) => set({ user }),
            logout: () => {
                set({ user: null, session: null, selectedBusinessId: null });
                localStorage.removeItem('lottery-app-storage-v1'); // Clear all persisted state on logout
            },
            defaultCommission: 0.07,
            setDefaultCommission: (rate) => set({ defaultCommission: rate }),
            selectedBusinessId: null,
            setSelectedBusinessId: (id) => set({ selectedBusinessId: id }),
            session: null,
            setSession: (session) => set({ session }),
        }),
        {
            name: 'lottery-app-storage-v1', // Renamed to force fresh cache (auto-migration of sorts)
            partialize: (state) => ({
                user: state.user, // Persist user again for instant load
                selectedBusinessId: state.selectedBusinessId,
                defaultCommission: state.defaultCommission
            }),
        }
    )
);
