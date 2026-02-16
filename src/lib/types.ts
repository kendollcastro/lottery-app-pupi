export interface User {
    id: string;
    name: string;
    role: 'admin' | 'user';
    username: string;
}

export interface Expense {
    id: string;
    description: string;
    amount: number;
    createdAt: string; // ISO date
}

export interface Deduction {
    id: string;
    userId: string;
    businessId: string; // [NEW]
    amount: number;
    reason: string;
    date: string; // YYYY-MM-DD
    createdAt: string; // ISO date
}

export interface Advance {
    id: string;
    userId: string;
    businessId: string; // [NEW]
    amount: number;
    reason: string;
    date: string; // YYYY-MM-DD
    createdAt: string; // ISO date
}

export interface DailyClosure {
    id: string;
    date: string; // YYYY-MM-DD
    userId: string;
    businessId: string; // [NEW]
    saleTotal: number;
    prizesPaid: number;
    commissionPercentage: number; // e.g., 0.15 for 15%
    expenses: Expense[];

    // Calculated fields (can be computed on fly, but good to store if snapshotting)
    calculatedProfit: number;
}

export interface Week {
    id: string;
    name: string;
    startDate: string; // YYYY-MM-DD
    endDate: string;   // YYYY-MM-DD
    status: 'active' | 'closed';
    isPinned: boolean;
    adjustmentPlus?: number;
    adjustmentMinus?: number;
}

// Helper to keep track of current view state
export interface PeriodModules {
    id: string;
    viewName: string;
    startDate: string;
    endDate: string;
}

export interface Business {
    id: string;
    userId: string;
    name: string;
    active: boolean; // For soft delete or UI visibility
    createdAt: string;
}
