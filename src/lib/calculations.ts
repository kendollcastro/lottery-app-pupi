import type { Expense, Advance } from './types';

/**
 * Calculates the Operating Profit.
 * Formula: profit = sale_total - prizes_paid + commission - expenses_total
 * Note: Expenses reduce the profit of the business.
 */
export function calculateProfit(
    saleTotal: number,
    prizesPaid: number,
    commissionPercentage: number,
    expenses: Expense[]
): number {
    const commission = saleTotal * commissionPercentage;
    const expensesTotal = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    return saleTotal - prizesPaid - commission - expensesTotal;
}

/**
 * Calculates the User Balance (Liquidación).
 * Formula: user_balance = profit - advances_total
 * Note: Advances are personal withdrawals, they don't affect business profit calculate,
 * but they do affect the final amount the user holds/owes.
 */
export function calculateBalance(
    profit: number,
    advances: Advance[]
): number {
    const advancesTotal = advances.reduce((sum, adv) => sum + adv.amount, 0);
    return profit - advancesTotal;
}
