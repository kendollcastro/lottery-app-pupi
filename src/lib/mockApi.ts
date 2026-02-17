import type { User, DailyClosure, Advance, Week, Deduction } from './types';
import { calculateProfit } from './calculations';

// Initial Mock Data
const MOCK_USERS: User[] = [
    { id: 'u1', name: 'Juan Perez', username: 'juan', role: 'user' },
    { id: 'u2', name: 'Maria Lopez', username: 'maria', role: 'user' },
    { id: 'a1', name: 'Admin User', username: 'admin', role: 'admin' },
];

const MOCK_WEEKS: Week[] = [
    {
        id: 'w1',
        businessId: 'b1',
        name: 'Semana 19 Enero',
        startDate: '2026-01-12', // Monday
        endDate: '2026-01-18',
        status: 'active',
        isPinned: true
    },
    {
        id: 'w2',
        businessId: 'b1',
        name: 'Semana 12 Enero',
        startDate: '2026-01-05', // Monday
        endDate: '2026-01-11',
        status: 'closed',
        isPinned: false
    },
    {
        id: 'w3',
        businessId: 'b1',
        name: 'Semana 05 Enero',
        startDate: '2025-12-29', // Monday
        endDate: '2026-01-04',
        status: 'closed',
        isPinned: false
    },
];

const MOCK_CLOSURES: DailyClosure[] = [
    {
        id: 'c1',
        userId: 'u1',
        businessId: 'b1',
        date: '2023-10-23',
        saleTotal: 50000,
        prizesPaid: 12000,
        commissionPercentage: 0.07,
        expenses: [
            { id: 'e1', description: 'Papel', amount: 2000, createdAt: '2023-10-23T10:00:00Z' }
        ],
        calculatedProfit: 0 // Will be calc on load
    }
];

const MOCK_ADVANCES: Advance[] = [
    { id: 'a1', userId: 'u1', businessId: 'b1', amount: 50000, reason: 'Adelanto Semana Santa', date: '2023-10-10', createdAt: '2023-10-10T10:00:00Z' },
    { id: 'a2', userId: 'u1', businessId: 'b1', amount: 25000, reason: 'Pago parcial', date: '2023-10-12', createdAt: '2023-10-12T14:30:00Z' },
];

let MOCK_DEDUCTIONS: Deduction[] = [];

// Helper to simulate DB delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApi = {
    login: async (username: string): Promise<User | null> => {
        await delay(300);
        return MOCK_USERS.find(u => u.username === username) || null;
    },

    register: async (user: Omit<User, 'id'>): Promise<User> => {
        await delay(500);
        const newUser: User = {
            ...user,
            id: `u${Date.now()}`
        };
        MOCK_USERS.push(newUser);
        return newUser;
    },

    // Deductions
    getDeductions: async (userId: string): Promise<Deduction[]> => {
        await delay(200);
        return MOCK_DEDUCTIONS.filter(d => d.userId === userId);
    },

    createDeduction: async (data: Omit<Deduction, 'id'>): Promise<Deduction> => {
        await delay(300);
        const newDeduction: Deduction = {
            ...data,
            id: `d-${Date.now()}`
        };
        MOCK_DEDUCTIONS.push(newDeduction);
        return newDeduction;
    },

    deleteDeduction: async (id: string): Promise<void> => {
        await delay(300);
        MOCK_DEDUCTIONS = MOCK_DEDUCTIONS.filter(d => d.id !== id);
    },

    getWeeks: async (): Promise<Week[]> => {
        await delay(200);
        return [...MOCK_WEEKS];
    },

    createWeek: async (name: string): Promise<Week> => {
        await delay(400);

        // Calculate the nearest Monday (start of current week)
        const today = new Date();
        const diff = today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1); // Adjust when day is Sunday
        const monday = new Date(today.setDate(diff));

        const newWeek: Week = {
            id: `w${Date.now()}`,
            businessId: 'b1',
            name,
            startDate: monday.toISOString().split('T')[0],
            endDate: new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'active',
            isPinned: false,
            adjustmentPlus: 0,
            adjustmentMinus: 0
        };
        MOCK_WEEKS.unshift(newWeek);
        return newWeek;
    },

    updateWeek: async (week: Week): Promise<Week> => {
        await delay(300);
        const index = MOCK_WEEKS.findIndex(w => w.id === week.id);
        if (index !== -1) {
            MOCK_WEEKS[index] = week;
        }
        return week;
    },

    deleteWeek: async (id: string): Promise<void> => {
        await delay(300);
        const index = MOCK_WEEKS.findIndex(w => w.id === id);
        if (index !== -1) {
            MOCK_WEEKS.splice(index, 1);
        }
    },

    getClosure: async (userId: string, date: string): Promise<DailyClosure | null> => {
        await delay(200);
        const closure = MOCK_CLOSURES.find(c => c.userId === userId && c.date === date);
        if (closure) {
            // Recalculate profit on fetch to ensure consistency
            closure.calculatedProfit = calculateProfit(
                closure.saleTotal,
                closure.prizesPaid,
                closure.commissionPercentage,
                closure.expenses
            );
        }
        return closure || null;
    },

    getAllClosures: async (userId: string): Promise<DailyClosure[]> => {
        await delay(300);
        return MOCK_CLOSURES.filter(c => c.userId === userId).map(c => ({
            ...c,
            calculatedProfit: calculateProfit(c.saleTotal, c.prizesPaid, c.commissionPercentage, c.expenses)
        }));
    },

    saveClosure: async (closure: DailyClosure): Promise<void> => {
        await delay(300);
        const index = MOCK_CLOSURES.findIndex(c => c.id === closure.id);
        if (index >= 0) {
            MOCK_CLOSURES[index] = closure;
        } else {
            MOCK_CLOSURES.push(closure);
        }
    },

    getAdvances: async (userId: string): Promise<Advance[]> => {
        await delay(200);
        return MOCK_ADVANCES.filter(a => a.userId === userId);
    },

    createAdvance: async (advance: Omit<Advance, 'id' | 'createdAt'>): Promise<Advance> => {
        await delay(300);
        const newAdvance: Advance = {
            id: `adv${Date.now()}`,
            createdAt: new Date().toISOString(),
            ...advance
        };
        MOCK_ADVANCES.push(newAdvance);
        return newAdvance;
    },
    updateAdvance: async (advance: Advance): Promise<Advance> => {
        await delay(300);
        const index = MOCK_ADVANCES.findIndex(a => a.id === advance.id);
        if (index !== -1) {
            MOCK_ADVANCES[index] = advance;
        }
        return advance;
    },
    deleteAdvance: async (id: string): Promise<void> => {
        await delay(300);
        const index = MOCK_ADVANCES.findIndex(a => a.id === id);
        if (index !== -1) {
            MOCK_ADVANCES.splice(index, 1);
        }
    }
};
