import { supabase } from './supabase';
import type { User, DailyClosure, Advance, Week, Deduction } from './types';
import { calculateProfit } from './calculations';

export const api = {
    // Auth & Profile
    getCurrentUser: async (): Promise<User | null> => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return null;

        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (profile) {
            return {
                id: profile.id,
                name: profile.name,
                username: profile.username,
                role: profile.role as 'user' | 'admin'
            };
        }
        return null;
    },

    // Weeks
    getWeeks: async (): Promise<Week[]> => {
        const { data, error } = await supabase
            .from('weeks')
            .select('*')
            .order('start_date', { ascending: false });

        if (error) {
            console.error('Error fetching weeks:', error);
            return [];
        }

        return data.map((w: any) => ({
            id: w.id,
            name: w.name,
            startDate: w.start_date,
            endDate: w.end_date,
            status: w.status,
            isPinned: w.is_pinned
        }));
    },

    createWeek: async (week: Omit<Week, 'id'>): Promise<Week> => {
        const { data, error } = await supabase
            .from('weeks')
            .insert({
                name: week.name,
                start_date: week.startDate,
                end_date: week.endDate,
                status: week.status,
                is_pinned: week.isPinned
            })
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            name: data.name,
            startDate: data.start_date,
            endDate: data.end_date,
            status: data.status,
            isPinned: data.is_pinned
        };
    },

    // Closures
    getClosure: async (userId: string, date: string): Promise<DailyClosure | null> => {
        const { data, error } = await supabase
            .from('daily_closures')
            .select('*')
            .eq('user_id', userId)
            .eq('date', date)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching closure:', error);
        }

        if (data) {
            return {
                id: data.id,
                userId: data.user_id,
                date: data.date,
                saleTotal: Number(data.sale_total),
                prizesPaid: Number(data.prizes_paid),
                commissionPercentage: Number(data.commission_percentage),
                expenses: [], // TODO: Add expenses table if needed
                calculatedProfit: calculateProfit(
                    Number(data.sale_total),
                    Number(data.prizes_paid),
                    Number(data.commission_percentage),
                    []
                )
            };
        }
        return null;
    },

    getAllClosures: async (userId: string): Promise<DailyClosure[]> => {
        const { data, error } = await supabase
            .from('daily_closures')
            .select('*')
            .eq('user_id', userId);

        if (error) {
            console.error('Error fetching all closures:', error);
            return [];
        }

        return data.map((c: any) => ({
            id: c.id,
            userId: c.user_id,
            date: c.date,
            saleTotal: Number(c.sale_total),
            prizesPaid: Number(c.prizes_paid),
            commissionPercentage: Number(c.commission_percentage),
            expenses: [],
            calculatedProfit: calculateProfit(
                Number(c.sale_total),
                Number(c.prizes_paid),
                Number(c.commission_percentage),
                []
            )
        }));
    },

    saveClosure: async (closure: DailyClosure): Promise<void> => {
        // Upsert based on ID if present, or create new
        // For simplicity with RLS and our logic:
        const { error } = await supabase
            .from('daily_closures')
            .upsert({
                id: closure.id.startsWith('temp-') ? undefined : closure.id, // Let DB gen UUID if temp
                user_id: closure.userId,
                date: closure.date,
                sale_total: closure.saleTotal,
                prizes_paid: closure.prizesPaid,
                commission_percentage: closure.commissionPercentage,
            }, { onConflict: 'user_id, date' });

        if (error) {
            console.error('Error saving closure:', error);
            throw error;
        }
    },

    // Advances
    getAdvances: async (userId: string): Promise<Advance[]> => {
        const { data, error } = await supabase
            .from('advances')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false });

        if (error) {
            console.error('Error fetching advances:', error);
            return [];
        }

        return data.map((a: any) => ({
            id: a.id,
            userId: a.user_id,
            amount: Number(a.amount),
            reason: a.reason,
            date: a.date,
            createdAt: a.created_at
        }));
    },

    createAdvance: async (advance: Omit<Advance, 'id' | 'createdAt'>): Promise<Advance> => {
        const { data, error } = await supabase
            .from('advances')
            .insert({
                user_id: advance.userId,
                amount: advance.amount,
                reason: advance.reason,
                date: advance.date
            })
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            userId: data.user_id,
            amount: Number(data.amount),
            reason: data.reason,
            date: data.date,
            createdAt: data.created_at
        };
    },

    deleteAdvance: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('advances')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Deductions
    getDeductions: async (userId: string): Promise<Deduction[]> => {
        const { data, error } = await supabase
            .from('deductions')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false });

        if (error) {
            console.error('Error fetching deductions:', error);
            return [];
        }

        return data.map((d: any) => ({
            id: d.id,
            userId: d.user_id,
            amount: Number(d.amount),
            reason: d.reason,
            date: d.date,
            createdAt: d.created_at
        }));
    },

    createDeduction: async (data: Omit<Deduction, 'id'>): Promise<Deduction> => {
        const { data: newDed, error } = await supabase
            .from('deductions')
            .insert({
                user_id: data.userId,
                amount: data.amount,
                reason: data.reason,
                date: data.date
            })
            .select()
            .single();

        if (error) throw error;

        return {
            id: newDed.id,
            userId: newDed.user_id,
            amount: Number(newDed.amount),
            reason: newDed.reason,
            date: newDed.date,
            createdAt: newDed.created_at
        };
    },

    deleteDeduction: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('deductions')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
