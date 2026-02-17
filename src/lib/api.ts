import { supabase } from './supabase';
import type { User, DailyClosure, Advance, Week, Deduction, Business } from './types';
import { calculateProfit } from './calculations';

// Helper for retrying failed requests (network or abort errors)
async function safeFetch<T>(
    operation: () => Promise<{ data: T | null; error: any }>,
    retries = 3,
    delay = 500
): Promise<T | null> {
    for (let i = 0; i < retries; i++) {
        try {
            const { data, error } = await operation();
            if (error) throw error;
            return data;
        } catch (err: any) {
            const isAbort = err.name === 'AbortError' || err.message?.includes('aborted');
            const isNetwork = err.message?.includes('Failed to fetch') || err.message?.includes('Network request failed');

            // If it's the last attempt, return null (and let the caller handle default)
            if (i === retries - 1) {
                console.error(`Operation failed after ${retries} attempts:`, err);
                return null;
            }

            // Retry only on Abort or Network errors
            if (isAbort || isNetwork) {
                console.warn(`Attempt ${i + 1} failed (${err.message}), retrying in ${delay}ms...`);
                await new Promise(r => setTimeout(r, delay * (i + 1))); // Exponential backoff
                continue;
            }

            // Limit exceeded or other error
            console.error("Operation failed non-retryable error:", err);
            return null;
        }
    }
    return null;
}

export const api = {
    // Auth & Profile
    getCurrentUser: async (): Promise<User | null> => {
        return safeFetch(async () => {
            // Create a timeout promise that rejects after 10 seconds
            const timeoutPromise = new Promise<null>((_, reject) => {
                setTimeout(() => reject(new Error('Request timed out')), 10000);
            });

            // The actual fetch operation
            const fetchPromise = (async () => {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user) return { data: null, error: null };

                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .maybeSingle();

                if (error) {
                    return { data: null, error };
                }

                if (profile) {
                    return {
                        data: {
                            id: profile.id,
                            name: profile.name,
                            username: profile.username,
                            role: profile.role as 'user' | 'admin'
                        },
                        error: null
                    };
                }
                return { data: null, error: null };
            })();

            try {
                // We race against timeout, but safeFetch handles the outer retry.
                // If timeout wins, it rejects, triggering safeFetch retry.
                const result = await Promise.race([fetchPromise, timeoutPromise]);
                return result as { data: User | null; error: any };
            } catch (e) {
                // If timeout or other error, return as error so safeFetch sees it
                return { data: null, error: e };
            }
        });
    },

    // Businesses
    getBusinesses: async (userId: string): Promise<Business[]> => {
        const data = await safeFetch(async () => {
            return await supabase
                .from('businesses')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
        });

        if (!data) return [];

        return (data as any[]).map((b: any) => ({
            id: b.id,
            userId: b.user_id,
            name: b.name,
            active: b.is_active,
            createdAt: b.created_at
        }));
    },

    createBusiness: async (userId: string, name: string): Promise<Business> => {
        const { data, error } = await supabase
            .from('businesses')
            .insert({ user_id: userId, name: name })
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            userId: data.user_id,
            name: data.name,
            active: data.is_active,
            createdAt: data.created_at
        };
    },

    deleteBusiness: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('businesses')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Weeks
    getWeeks: async (businessId: string): Promise<Week[]> => {
        if (!businessId) return [];

        const { data, error } = await supabase
            .from('weeks')
            .select('*')
            .eq('business_id', businessId) // Filter by business
            .order('start_date', { ascending: false });

        if (error) {
            console.error('Error fetching weeks:', error);
            return [];
        }

        return data.map((w: any) => ({
            id: w.id,
            businessId: w.business_id,
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
                business_id: week.businessId,
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
            businessId: data.business_id,
            name: data.name,
            startDate: data.start_date,
            endDate: data.end_date,
            status: data.status,
            isPinned: data.is_pinned
        };
    },

    deleteWeek: async (id: string): Promise<void> => {
        // 1. Fetch the week first to get dates and business_id
        const { data: week, error: fetchError } = await supabase
            .from('weeks')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !week) {
            console.error("Error fetching week for delete:", fetchError);
            throw new Error("Could not find week to delete");
        }

        // 2. Delete associated data (ZOMBIE DATA CLEANUP)
        // Cleanup Closures
        await supabase.from('daily_closures')
            .delete()
            .eq('business_id', week.business_id)
            .gte('date', week.start_date)
            .lte('date', week.end_date);

        // Cleanup Advances
        await supabase.from('advances')
            .delete()
            .eq('business_id', week.business_id)
            .gte('date', week.start_date)
            .lte('date', week.end_date);

        // Cleanup Deductions
        await supabase.from('deductions')
            .delete()
            .eq('business_id', week.business_id)
            .gte('date', week.start_date)
            .lte('date', week.end_date);

        // 3. Delete the Week itself
        const { error } = await supabase
            .from('weeks')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Closures
    getClosure: async (userId: string, date: string, businessId: string): Promise<DailyClosure | null> => {
        const { data, error } = await supabase
            .from('daily_closures')
            .select('*')
            .eq('user_id', userId)
            .eq('business_id', businessId)
            .eq('date', date)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching closure:', error);
        }

        if (data) {
            return {
                id: data.id,
                userId: data.user_id,
                businessId: data.business_id,
                date: data.date,
                saleTotal: Number(data.sale_total),
                prizesPaid: Number(data.prizes_paid),
                commissionPercentage: Number(data.commission_percentage),
                expenses: [],
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

    getAllClosures: async (userId: string, businessId: string): Promise<DailyClosure[]> => {
        const { data, error } = await supabase
            .from('daily_closures')
            .select('*')
            .eq('user_id', userId)
            .eq('business_id', businessId);

        if (error) {
            console.error('Error fetching all closures:', error);
            return [];
        }

        return data.map((c: any) => ({
            id: c.id,
            userId: c.user_id,
            businessId: c.business_id,
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
        const { error } = await supabase
            .from('daily_closures')
            .upsert({
                id: closure.id.startsWith('temp-') ? undefined : closure.id,
                user_id: closure.userId,
                business_id: closure.businessId,
                date: closure.date,
                sale_total: closure.saleTotal,
                prizes_paid: closure.prizesPaid,
                commission_percentage: closure.commissionPercentage,
            }, { onConflict: 'user_id, date, business_id' }); // Unique constraint must match DB

        if (error) {
            console.error('Error saving closure:', error);
            throw error;
        }
    },

    // Advances
    getAdvances: async (userId: string, businessId: string): Promise<Advance[]> => {
        const { data, error } = await supabase
            .from('advances')
            .select('*')
            .eq('user_id', userId)
            .eq('business_id', businessId)
            .order('date', { ascending: false });

        if (error) {
            console.error('Error fetching advances:', error);
            return [];
        }

        return data.map((a: any) => ({
            id: a.id,
            userId: a.user_id,
            businessId: a.business_id,
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
                business_id: advance.businessId,
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
            businessId: data.business_id,
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
    getDeductions: async (userId: string, businessId: string): Promise<Deduction[]> => {
        const { data, error } = await supabase
            .from('deductions')
            .select('*')
            .eq('user_id', userId)
            .eq('business_id', businessId)
            .order('date', { ascending: false });

        if (error) {
            console.error('Error fetching deductions:', error);
            return [];
        }

        return data.map((d: any) => ({
            id: d.id,
            userId: d.user_id,
            businessId: d.business_id,
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
                business_id: data.businessId,
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
            businessId: newDed.business_id,
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
