import * as React from 'react';
import { useAppStore } from '../lib/store';
import { mockApi } from '../lib/mockApi';
import type { DailyClosure, Advance, Week } from '../lib/types';
import { calculateProfit } from '../lib/calculations';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import {
    ArrowLeft,
    BarChart3,
    Calendar,
    Save,
    Plus,
    Banknote,
    Loader2,
    Wallet,
    User,
    ChevronUp,
    ChevronDown,
    Trash2,
    CalendarClock
} from 'lucide-react';
import { cn } from '../lib/utils';
// import { toast } from 'sonner';

interface WeekViewPageProps {
    weekId: string;
    onBack: () => void;
    onNavigate: (page: 'weeks' | 'sales' | 'reports' | 'profile') => void;
}

export function WeekViewPage({ weekId, onBack, onNavigate }: WeekViewPageProps) {
    const { user } = useAppStore();
    const [week, setWeek] = React.useState<Week | null>(null);
    const [closures, setClosures] = React.useState<DailyClosure[]>([]);
    const [advances, setAdvances] = React.useState<Advance[]>([]);
    const [loading, setLoading] = React.useState(true);

    // Accordion state for days
    const [expandedDay, setExpandedDay] = React.useState<string | null>(null);

    // Carry-over State
    const [prevWeek, setPrevWeek] = React.useState<Week | null>(null);
    const [prevWeekBalance, setPrevWeekBalance] = React.useState<number | null>(null);

    // New Advance State
    const [newAdvanceAmount, setNewAdvanceAmount] = React.useState('');
    const [creatingAdvance, setCreatingAdvance] = React.useState(false);

    // Helper to generate dates
    const getDaysArray = (start: string, end: string) => {
        const arr = [];
        const dt = new Date(start);
        const endDt = new Date(end);
        while (dt <= endDt) {
            arr.push(new Date(dt).toISOString().split('T')[0]);
            dt.setDate(dt.getDate() + 1);
        }
        return arr;
    };

    const days = React.useMemo(() => {
        if (!week) return [];
        return getDaysArray(week.startDate, week.endDate);
    }, [week]);

    // Initial Fetch
    React.useEffect(() => {
        const init = async () => {
            if (!user) return;
            setLoading(true);
            try {
                // 1. Fetch Week Details
                const allWeeks = await mockApi.getWeeks();
                const currentWeek = allWeeks.find(w => w.id === weekId);
                setWeek(currentWeek || null);

                if (currentWeek) {
                    const dates = getDaysArray(currentWeek.startDate, currentWeek.endDate);

                    // 2. Fetch Closures for each day
                    const closurePromises = dates.map(async (date) => {
                        const existing = await mockApi.getClosure(user.id, date);
                        if (existing) return existing;

                        return {
                            id: `temp-${date}`,
                            userId: user.id,
                            date: date,
                            saleTotal: 0,
                            prizesPaid: 0,
                            commissionPercentage: useAppStore.getState().defaultCommission,
                            expenses: [],
                            calculatedProfit: 0
                        } as DailyClosure;
                    });

                    const fetchedClosures = await Promise.all(closurePromises);
                    setClosures(fetchedClosures);

                    // Expand the current day (or first day)
                    const today = new Date().toISOString().split('T')[0];
                    if (dates.includes(today)) {
                        setExpandedDay(today);
                    } else {
                        setExpandedDay(dates[0]);
                    }

                    // 4. Find Previous Week & Balance (Mock Logic)
                    // In real app, we query by startDate < current.startDate order by startDate desc limit 1
                    // Here we just look for one that ends day before start or similar.
                    // For simplicity, let's just find any week that ended clearly before this one.

                    // Better verify logic: simply find the week immediately before.
                    // Let's assume list is somewhat ordered or we sort it.
                    const sorted = [...allWeeks].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
                    const currentIndex = sorted.findIndex(w => w.id === currentWeek.id);
                    const prev = sorted[currentIndex + 1]; // Next in desc list is "previous" in time

                    if (prev) {
                        setPrevWeek(prev);
                        // Calculate its balance: (Profits + Advances of that week)
                        // This is heavy in client-side mock, but okay.
                        const prevClosures = await mockApi.getAllClosures(user.id);
                        const prevWeekDays = getDaysArray(prev.startDate, prev.endDate);
                        const relevantClosures = prevClosures.filter(c => prevWeekDays.includes(c.date));
                        const prevProfit = relevantClosures.reduce((sum, c) => sum + (c.calculatedProfit || 0), 0);

                        const allAdvances = await mockApi.getAdvances(user.id);
                        const prevAdvances = allAdvances.filter(a => a.date >= prev.startDate && a.date <= prev.endDate);
                        const prevAdvTotal = prevAdvances.reduce((sum, a) => sum + a.amount, 0);

                        setPrevWeekBalance(prevProfit + prevAdvTotal);
                    } else {
                        setPrevWeek(null);
                        setPrevWeekBalance(null);
                    }
                }

                // 3. Fetch Advances
                const userAdvances = await mockApi.getAdvances(user.id);
                setAdvances(userAdvances);

            } finally {
                setLoading(false);
            }
        };
        init();
    }, [user, weekId]);

    // Calculations
    const totalProfit = React.useMemo(() => {
        return closures.reduce((sum, c) => sum + (c.calculatedProfit || 0), 0);
    }, [closures]);

    const totalSales = React.useMemo(() => closures.reduce((sum, c) => sum + (c.saleTotal || 0), 0), [closures]);
    const totalPrizes = React.useMemo(() => closures.reduce((sum, c) => sum + (c.prizesPaid || 0), 0), [closures]);

    const totalCommission = React.useMemo(() => closures.reduce((sum, c) => sum + ((c.saleTotal || 0) * (c.commissionPercentage || 0.07)), 0), [closures]);

    // Filter advances for this week
    const weekAdvances = React.useMemo(() => {
        if (!week) return [];
        return advances.filter(a => a.date >= week.startDate && a.date <= week.endDate);
    }, [advances, week]);

    // Adjustments
    const [adjustmentPlus, setAdjustmentPlus] = React.useState<string>('');
    const [adjustmentMinus, setAdjustmentMinus] = React.useState<string>('');

    // Effect to load adjustments when week loads
    React.useEffect(() => {
        if (week) {
            setAdjustmentPlus(week.adjustmentPlus?.toString() || '');
            setAdjustmentMinus(week.adjustmentMinus?.toString() || '');
        }
    }, [week]);

    const totalAdvances = React.useMemo(() => weekAdvances.reduce((sum, a) => sum + (a.amount || 0), 0), [weekAdvances]);

    // Parse adjustments safely
    const adjPlusVal = parseInt(adjustmentPlus) || 0;
    const adjMinusVal = parseInt(adjustmentMinus) || 0;

    // Per user request: Advances should ADD to the profit.
    // Logic: Profit + Advances + AdjPlus - AdjMinus = Final Balance
    const finalBalance = totalProfit + totalAdvances + adjPlusVal - adjMinusVal;

    const handleAdjustmentChange = async (type: 'plus' | 'minus', value: string) => {
        if (!week) return;

        // Update local UI state immediately
        if (type === 'plus') setAdjustmentPlus(value);
        else setAdjustmentMinus(value);

        // Debounce or save logic could go here, but for now let's just save on blur or effect?
        // Simpler: update the actual week object on blur or just do it here with a small delay? 
        // Let's do save on simple update for now, or maybe just update local week state then trigger save.
    };

    const saveAdjustments = async () => {
        if (!week) return;
        const p = parseInt(adjustmentPlus) || 0;
        const m = parseInt(adjustmentMinus) || 0;

        const updatedWeek = { ...week, adjustmentPlus: p, adjustmentMinus: m };
        setWeek(updatedWeek); // Optimistic
        await mockApi.updateWeek(updatedWeek);
    };

    // Actions
    const handleClosureChange = (closureId: string, field: 'saleTotal' | 'prizesPaid', value: string) => {
        const numValue = parseInt(value) || 0;
        setClosures(prev => prev.map(c => {
            if (c.id === closureId) {
                const updated = { ...c, [field]: numValue };
                // Live recalc profit for UI
                updated.calculatedProfit = calculateProfit(
                    updated.saleTotal,
                    updated.prizesPaid,
                    updated.commissionPercentage,
                    updated.expenses
                );
                return updated;
            }
            return c;
        }));
    };

    const handleSaveClosure = async (closure: DailyClosure) => {
        const target = closures.find(c => c.id === closure.id);
        if (!target) return;
        await mockApi.saveClosure(target);
    };

    // Delete Modal State
    const [advanceToDelete, setAdvanceToDelete] = React.useState<string | null>(null);

    const handleCreateAdvance = async () => {
        if (!newAdvanceAmount || !user || !week) return;

        // Ensure date is within the current week
        const today = new Date().toISOString().split('T')[0];
        let targetDate = today;
        if (today < week.startDate || today > week.endDate) {
            targetDate = week.startDate;
        }

        setCreatingAdvance(true);
        try {
            const amount = parseInt(newAdvanceAmount);
            await mockApi.createAdvance({
                userId: user.id,
                amount: amount,
                reason: 'Adelanto Manual',
                date: targetDate
            });
            // Refresh advances
            const userAdvances = await mockApi.getAdvances(user.id);
            setAdvances(userAdvances);
            setNewAdvanceAmount('');
        } finally {
            setCreatingAdvance(false);
        }
    };

    const handleImportBalance = async () => {
        if (!prevWeek || prevWeekBalance === null || !user || !week) return;

        if (!confirm(`¿Importar el saldo de ${fmt(prevWeekBalance)} de la semana anterior?`)) return;

        // Ensure date is within the current week
        const today = new Date().toISOString().split('T')[0];
        let targetDate = today;
        if (today < week.startDate || today > week.endDate) {
            targetDate = week.startDate;
        }

        setCreatingAdvance(true);
        try {
            // Logic: Just carry over the exact amount.
            // If previous week had +10,000 profit, we add +10,000 here.
            await mockApi.createAdvance({
                userId: user.id,
                amount: prevWeekBalance,
                reason: `Saldo Anterior (${prevWeek.name})`,
                date: targetDate
            });
            // Refresh advances
            const userAdvances = await mockApi.getAdvances(user.id);
            setAdvances(userAdvances);
        } finally {
            setCreatingAdvance(false);
        }
    };

    const handleDeleteClick = (id: string) => {
        setAdvanceToDelete(id);
    };

    const confirmDeleteAdvance = async () => {
        if (!advanceToDelete) return;
        try {
            await mockApi.deleteAdvance(advanceToDelete);
            const userAdvances = await mockApi.getAdvances(user!.id);
            setAdvances(userAdvances);
            setAdvanceToDelete(null);
        } catch (error) {
            console.error("Failed to delete advance", error);
        }
    };

    /*
    const handleMoveAdvance = async (advance: Advance) => {
        if (!week) return;
        if (!confirm(`¿Mover adelanto de ${fmt(advance.amount)} a la siguiente semana?`)) return;

        try {
            const currentDt = new Date(advance.date);
            currentDt.setDate(currentDt.getDate() + 7);
            const newDate = currentDt.toISOString().split('T')[0];

            await mockApi.updateAdvance({
                ...advance,
                date: newDate
            });

            // Refresh
            const userAdvances = await mockApi.getAdvances(user!.id);
            setAdvances(userAdvances);
        } catch (e) {
            console.error(e);
        }
    };
    */



    // Helper to format currency
    const fmt = (amount: number) => new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' }).format(amount);
    const fmtPlain = (amount: number) => amount.toLocaleString('es-CR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

    const getDayName = (dateStr: string) => {
        const date = new Date(dateStr);
        const dayName = date.toLocaleDateString('es-ES', { weekday: 'long', timeZone: 'UTC' });
        return dayName.charAt(0).toUpperCase() + dayName.slice(1);
    };

    const getDateInitial = (dateStr: string) => {
        const dayName = new Date(dateStr).toLocaleDateString('es-ES', { weekday: 'long', timeZone: 'UTC' });
        return dayName.charAt(0).toUpperCase();
    };

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-[#F8F9FB] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-[#F8F9FB] pb-20">

            {/* Header */}
            <div className="px-5 pt-6 pb-2">
                <div className="flex justify-between items-start mb-4">
                    <Button variant="ghost" className="p-0 text-blue-600 hover:bg-transparent hover:text-blue-700 font-medium h-auto -ml-1 gap-1" onClick={onBack}>
                        <ArrowLeft className="h-4 w-4" />
                        Volver
                    </Button>

                    {/* Previous Balance Action */}
                    {prevWeek && prevWeekBalance !== null && prevWeekBalance !== 0 && (
                        <Button
                            variant="secondary"
                            size="sm"
                            className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-none h-8 px-3 rounded-full text-xs font-bold transition-colors"
                            onClick={handleImportBalance}
                        >
                            <CalendarClock className="h-3.5 w-3.5 mr-1.5" />
                            Saldo: {fmt(prevWeekBalance)}
                        </Button>
                    )}
                </div>

                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900">{week?.name || 'Semana'}</h1>
                    <p className="text-sm text-gray-400 font-medium">
                        {week ? `${week.startDate} - ${week.endDate}` : 'Cargando...'}
                    </p>
                </div>

                {/* Manual Adjustments */}
                {/* Manual Adjustments Dropdown */}
                <div className="mt-4">
                    <details className="group">
                        <summary className="flex items-center gap-2 text-sm font-bold text-gray-500 cursor-pointer list-none hover:text-gray-700 transition-colors">
                            <span className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 shadow-sm group-open:bg-gray-50 transition-all flex items-center gap-2">
                                <Banknote className="w-4 h-4" />
                                Ajustes de Ganancia
                                <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                            </span>
                        </summary>

                        <div className="mt-3 p-4 bg-white rounded-2xl shadow-sm border border-gray-100 animate-in slide-in-from-top-2 duration-200">
                            <div className="flex gap-4">
                                <div className="flex-1 space-y-1.5">
                                    <label className="text-[10px] uppercase tracking-wider font-bold text-green-600 block">Bonificación (+)</label>
                                    <div className="relative">
                                        <Input
                                            className="border-green-100 bg-green-50/50 text-green-700 font-bold text-right pr-2 focus:border-green-500 focus:ring-green-200"
                                            placeholder="0"
                                            value={adjustmentPlus === '0' ? '' : adjustmentPlus}
                                            onChange={(e) => handleAdjustmentChange('plus', e.target.value)}
                                            onBlur={saveAdjustments}
                                            type="number"
                                        />
                                    </div>
                                </div>
                                <div className="flex-1 space-y-1.5">
                                    <label className="text-[10px] uppercase tracking-wider font-bold text-red-600 block">Deducción (-)</label>
                                    <div className="relative">
                                        <Input
                                            className="border-red-100 bg-red-50/50 text-red-600 font-bold text-right pr-2 focus:border-red-500 focus:ring-red-200"
                                            placeholder="0"
                                            value={adjustmentMinus === '0' ? '' : adjustmentMinus}
                                            onChange={(e) => handleAdjustmentChange('minus', e.target.value)}
                                            onBlur={saveAdjustments}
                                            type="number"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </details>
                </div>
            </div>

            <div className="flex-1 px-5 space-y-6">

                {/* Main KPI Card */}
                <Card className="p-6 rounded-3xl border-none shadow-[0_2px_20px_-5px_rgba(0,0,0,0.05)] bg-white">
                    <div className="flex justify-between items-start mb-3">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ganancia Neta</span>
                        <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">Actual</span>
                    </div>
                    <div className="mb-8">
                        <span className={cn("text-4xl font-extrabold tracking-tight", finalBalance < 0 ? "text-red-500" : "text-green-600")}>
                            {fmt(finalBalance)}
                        </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-6">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Ventas</p>
                            <p className="text-sm font-bold text-gray-900">₡{fmtPlain(totalSales)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Premios</p>
                            <p className="text-sm font-bold text-gray-900">₡{fmtPlain(totalPrizes)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Comisión</p>
                            <p className="text-sm font-bold text-gray-900">₡{fmtPlain(totalCommission)}</p>
                        </div>
                    </div>
                </Card>

                {/* Daily Detail Section */}
                <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 ml-1">Detalle Por Día</h3>
                    <div className="space-y-3">
                        {days.map((date) => {
                            const closure = closures.find(c => c.date === date);
                            if (!closure) return null; // Should not happen given init logic

                            const isExpanded = expandedDay === date;

                            return (
                                <Card key={date} className={cn(
                                    "overflow-hidden border-none shadow-sm rounded-2xl bg-white transition-all",
                                    !isExpanded && "opacity-80 hover:opacity-100"
                                )}>
                                    <button
                                        onClick={() => setExpandedDay(isExpanded ? null : date)}
                                        className="w-full flex items-center justify-between p-5"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "h-10 w-10 flex items-center justify-center rounded-full font-bold text-lg",
                                                isExpanded ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-500"
                                            )}>
                                                {getDateInitial(date)}
                                            </div>
                                            <div className="text-left">
                                                <p className="font-bold text-gray-900">{getDayName(date)}</p>
                                                <p className="text-xs text-gray-400 font-medium">{date}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {!isExpanded && (
                                                <span className="text-sm font-bold text-gray-900">₡{fmtPlain(closure.saleTotal)}</span>
                                            )}
                                            {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-300" /> : <ChevronDown className="h-5 w-5 text-gray-300" />}
                                        </div>
                                    </button>

                                    {/* Expanded Content */}
                                    {isExpanded && (
                                        <div className="px-5 pb-5 animate-in slide-in-from-top-2 duration-200">
                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Venta</label>
                                                    <div className="bg-gray-50 rounded-xl px-1 py-1 border border-transparent focus-within:border-blue-200 focus-within:bg-white transition-all">
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold pointer-events-none z-10">₡</span>
                                                            <Input
                                                                className="pl-12 border-none bg-transparent shadow-none text-xl font-bold text-gray-900 p-2 h-auto focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                style={{ paddingLeft: '1.5rem' }}
                                                                value={closure.saleTotal === 0 ? '' : closure.saleTotal}
                                                                onChange={(e) => handleClosureChange(closure.id, 'saleTotal', e.target.value)}
                                                                type="number"
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Premio</label>
                                                    <div className="bg-gray-50 rounded-xl px-1 py-1 border border-transparent focus-within:border-blue-200 focus-within:bg-white transition-all">
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold pointer-events-none z-10">₡</span>
                                                            <Input
                                                                className="border-none bg-transparent shadow-none text-xl font-bold text-gray-900 p-2 h-auto focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                style={{ paddingLeft: '1.5rem' }}
                                                                value={closure.prizesPaid === 0 ? '' : closure.prizesPaid}
                                                                onChange={(e) => handleClosureChange(closure.id, 'prizesPaid', e.target.value)}
                                                                type="number"
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between mb-4">
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Comisión ({(closure.commissionPercentage * 100).toFixed(0)}%)</p>
                                                    <p className="text-lg font-bold text-blue-600">
                                                        {fmt(closure.saleTotal * closure.commissionPercentage)}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Ganancia Día</p>
                                                    <p className={cn("text-lg font-bold", closure.calculatedProfit < 0 ? "text-red-500" : "text-green-600")}>
                                                        {fmt(closure.calculatedProfit)}
                                                    </p>
                                                </div>
                                            </div>

                                            <Button
                                                className="w-full rounded-xl font-bold bg-blue-600 hover:bg-blue-700 h-12 shadow-lg shadow-blue-200 ios-active"
                                                onClick={() => handleSaveClosure(closure)}
                                            >
                                                <Save className="w-4 h-4 mr-2" />
                                                Guardar Cambios
                                            </Button>
                                        </div>
                                    )
                                    }
                                </Card>
                            );
                        })}
                    </div>
                </div>

                {/* Advances Section (Restored) */}
                <div className="pb-10">
                    <div className="flex items-center justify-between px-1 mb-3">
                        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Adelantos</h2>
                        <span className="text-xs font-medium text-gray-500 bg-white border border-gray-100 px-2 py-0.5 rounded-md shadow-sm">
                            Total: ₡{fmtPlain(totalAdvances)}
                        </span>
                    </div>

                    {/* New Advance Input */}
                    <div className="flex gap-3 mb-4">
                        <div className="relative flex-1">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₡</span>
                            <Input
                                placeholder="Monto del adelanto..."
                                className="pl-8 h-12 rounded-2xl border-none shadow-sm bg-white focus:ring-2 focus:ring-blue-100 text-lg transition-all"
                                type="number"
                                value={newAdvanceAmount}
                                onChange={(e) => setNewAdvanceAmount(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateAdvance()}
                            />
                        </div>
                        <Button
                            className="h-12 w-12 rounded-2xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 text-white ios-active shrink-0 flex items-center justify-center"
                            onClick={handleCreateAdvance}
                            disabled={creatingAdvance || !newAdvanceAmount}
                        >
                            {creatingAdvance ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-6 w-6" />}
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {weekAdvances.map((adv) => (
                            <Card key={adv.id} className="p-4 rounded-2xl border-none shadow-sm bg-white flex items-center justify-between hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 shadow-sm shrink-0">
                                        <Banknote className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-gray-900 truncate">{adv.reason || 'Adelanto General'}</p>
                                        <div className="flex flex-col">
                                            <p className="text-[10px] text-gray-400 font-medium">Creado: {new Date(adv.createdAt).toLocaleDateString()}</p>
                                            {adv.date !== adv.createdAt.split('T')[0] && (
                                                <p className="text-[10px] text-blue-500 font-bold">Aplicado: {adv.date}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 pl-2">
                                    <div className="text-right whitespace-nowrap">
                                        <div className={cn("text-lg font-bold", adv.amount > 0 ? "text-red-500" : "text-green-600")}>
                                            {adv.amount > 0 ? '-' : '+'} ₡{fmtPlain(Math.abs(adv.amount))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleDeleteClick(adv.id)}
                                        className="h-8 w-8 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors ios-active"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </Card>
                        ))}
                        {weekAdvances.length === 0 && (
                            <div className="text-center py-6 bg-white/50 rounded-3xl border border-dashed border-gray-200">
                                <p className="text-sm text-gray-400 font-medium">No hay adelantos registrados.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 z-10 pb-6 pt-3 px-6">
                <div className="flex justify-between items-center max-w-md mx-auto">
                    <button
                        onClick={onBack}
                        className="flex flex-col items-center gap-1 text-blue-600 transition-colors"
                    >
                        <Calendar className="h-6 w-6" />
                        <span className="text-[10px] font-bold">SEMANAS</span>
                    </button>
                    <button
                        onClick={() => onNavigate('sales')}
                        className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <Wallet className="h-6 w-6" />
                        <span className="text-[10px] font-bold">VENTAS</span>
                    </button>
                    <button
                        onClick={() => onNavigate('reports')}
                        className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <BarChart3 className="h-6 w-6" />
                        <span className="text-[10px] font-bold">REPORTES</span>
                    </button>
                    <button
                        onClick={() => onNavigate('profile')}
                        className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <User className="h-6 w-6" />
                        <span className="text-[10px] font-bold">PERFIL</span>
                    </button>
                </div>
            </div>

            <Modal
                isOpen={!!advanceToDelete}
                onClose={() => setAdvanceToDelete(null)}
                title="Eliminar Adelanto"
            >
                <div className="space-y-4">
                    <p className="text-gray-600">
                        ¿Estás seguro de que deseas eliminar este adelanto? Esta acción afectará el balance de la semana.
                    </p>
                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            className="flex-1"
                            onClick={() => setAdvanceToDelete(null)}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="danger"
                            className="flex-1 bg-red-600 text-white hover:bg-red-700"
                            onClick={confirmDeleteAdvance}
                            disabled={loading}
                        >
                            Eliminar
                        </Button>
                    </div>
                </div>
            </Modal>

        </div >
    );
}
