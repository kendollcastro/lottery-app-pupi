import * as React from 'react';
import { useAppStore } from '../lib/store';
import { api } from '../lib/api';
import type { DailyClosure, Advance, Week, Deduction } from '../lib/types';
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
import { toast } from 'sonner';

interface WeekViewPageProps {
    weekId: string;
    onBack: () => void;
    onNavigate: (page: 'weeks' | 'sales' | 'reports' | 'profile') => void;
}

export function WeekViewPage({ weekId, onBack, onNavigate }: WeekViewPageProps) {
    const { user, selectedBusinessId } = useAppStore();
    const [week, setWeek] = React.useState<Week | null>(null);
    const [closures, setClosures] = React.useState<DailyClosure[]>([]);
    const [advances, setAdvances] = React.useState<Advance[]>([]);
    const [deductions, setDeductions] = React.useState<Deduction[]>([]);
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
            if (!user || !selectedBusinessId) return;
            setLoading(true);
            try {
                // Parallel Fetch Phase 1: Get critical data
                const [allWeeks, allAdvances, allDeductions, weekClosures] = await Promise.all([
                    api.getWeeks(),
                    api.getAdvances(user.id, selectedBusinessId),
                    api.getDeductions(user.id, selectedBusinessId),
                    // Optimization: We can't fetch specific daily closures yet without the week,
                    // but we can fetch ALL closures for this user/business and filter locally
                    // since the dataset is likely small per user per business.
                    // This avoids the double-await waterfall.
                    api.getAllClosures(user.id, selectedBusinessId)
                ]);

                const currentWeek = allWeeks.find(w => w.id === weekId);
                setWeek(currentWeek || null);
                setAdvances(allAdvances);
                setDeductions(allDeductions);

                if (currentWeek) {
                    const weekDates = getDaysArray(currentWeek.startDate, currentWeek.endDate);

                    // Build Closure List (Merge existing with temps)
                    const mergedClosures = weekDates.map(date => {
                        const existing = weekClosures.find(c => c.date === date);
                        if (existing) return existing;
                        return {
                            id: `temp-${date}`,
                            userId: user.id,
                            businessId: selectedBusinessId,
                            date: date,
                            saleTotal: 0,
                            prizesPaid: 0,
                            commissionPercentage: useAppStore.getState().defaultCommission,
                            expenses: [],
                            calculatedProfit: 0
                        } as DailyClosure;
                    });
                    setClosures(mergedClosures);

                    // Expand the current day (or first day)
                    const today = new Date().toISOString().split('T')[0];
                    if (weekDates.includes(today)) {
                        setExpandedDay(today);
                    } else {
                        setExpandedDay(weekDates[0]);
                    }

                    // Calculate Previous Week Balance from the loaded data
                    // We already fetched ALL closures/advances/deductions, so we can compute this instantly via filter
                    // WITHOUT another network call.
                    const sorted = [...allWeeks].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
                    const currentIndex = sorted.findIndex(w => w.id === currentWeek.id);
                    const prev = sorted[currentIndex + 1];

                    if (prev) {
                        setPrevWeek(prev);
                        const prevWeekDays = getDaysArray(prev.startDate, prev.endDate);

                        const prevClosuresValid = weekClosures.filter(c => prevWeekDays.includes(c.date));
                        const prevProfit = prevClosuresValid.reduce((sum, c) => sum + (c.calculatedProfit || 0), 0);

                        const prevAdvancesValid = allAdvances.filter(a => a.date >= prev.startDate && a.date <= prev.endDate);
                        const prevAdvTotal = prevAdvancesValid.reduce((sum, a) => sum + a.amount, 0);

                        const prevDeductionsValid = allDeductions.filter(d => d.date >= prev.startDate && d.date <= prev.endDate);
                        const prevDedTotal = prevDeductionsValid.reduce((sum, d) => sum + d.amount, 0);

                        setPrevWeekBalance(prevProfit + prevAdvTotal - prevDedTotal);
                    } else {
                        setPrevWeek(null);
                        setPrevWeekBalance(null);
                    }
                }
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [user, weekId, selectedBusinessId]);

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

    const weekDeductions = React.useMemo(() => {
        if (!week) return [];
        return deductions.filter(d => d.date >= week.startDate && d.date <= week.endDate);
    }, [deductions, week]);

    const totalAdvances = React.useMemo(() => weekAdvances.reduce((sum, a) => sum + (a.amount || 0), 0), [weekAdvances]);
    const totalDeductions = React.useMemo(() => weekDeductions.reduce((sum, d) => sum + (d.amount || 0), 0), [weekDeductions]);

    // Per user request: Advances should ADD to the profit.
    // Logic: Profit + Advances - Deductions = Final Balance
    const finalBalance = totalProfit + totalAdvances - totalDeductions;



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
        await api.saveClosure(target);
    };

    // Delete Modal State
    const [advanceToDelete, setAdvanceToDelete] = React.useState<string | null>(null);

    const handleCreateAdvance = async () => {
        if (!newAdvanceAmount || !user || !week || !selectedBusinessId) return;

        // Ensure date is within the current week
        const today = new Date().toISOString().split('T')[0];
        let targetDate = today;
        if (today < week.startDate || today > week.endDate) {
            targetDate = week.startDate;
        }

        setCreatingAdvance(true);
        try {
            const amount = parseInt(newAdvanceAmount);
            await api.createAdvance({
                userId: user.id,
                businessId: selectedBusinessId,
                amount: amount,
                reason: 'Adelanto Manual',
                date: targetDate
            });
            // Refresh advances
            const userAdvances = await api.getAdvances(user.id, selectedBusinessId);
            setAdvances(userAdvances);
            setNewAdvanceAmount('');
            toast.success('Adelanto registrado', {
                description: `Se asignó un adelanto de ₡${fmtPlain(amount)}`
            });
        } finally {
            setCreatingAdvance(false);
        }
    };

    const handleImportBalance = async () => {
        if (!prevWeek || prevWeekBalance === null || !user || !week || !selectedBusinessId) return;

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
            await api.createAdvance({
                userId: user.id,
                businessId: selectedBusinessId,
                amount: prevWeekBalance,
                reason: `Saldo Anterior (${prevWeek.name})`,
                date: targetDate
            });
            // Refresh advances
            const userAdvances = await api.getAdvances(user.id, selectedBusinessId);
            setAdvances(userAdvances);
        } finally {
            setCreatingAdvance(false);
        }
    };

    const handleDeleteClick = (id: string) => {
        setAdvanceToDelete(id);
    };

    const confirmDeleteAdvance = async () => {
        if (!advanceToDelete || !selectedBusinessId) return;
        try {
            await api.deleteAdvance(advanceToDelete);
            const userAdvances = await api.getAdvances(user!.id, selectedBusinessId);
            setAdvances(userAdvances);
            setAdvanceToDelete(null);
            toast.success('Adelanto eliminado');
        } catch (error) {
            console.error("Failed to delete advance", error);
            toast.error('Error al eliminar adelanto');
        }
    };

    // --- Deductions Logic ---
    const [newDeductionAmount, setNewDeductionAmount] = React.useState('');
    const [newDeductionReason, setNewDeductionReason] = React.useState('');

    const handleCreateDeduction = async () => {
        if (!newDeductionAmount || !user || !week || !selectedBusinessId) return;

        // Ensure date is within the current week
        const today = new Date().toISOString().split('T')[0];
        let targetDate = today;
        if (today < week.startDate || today > week.endDate) {
            targetDate = week.startDate;
        }

        try {
            await api.createDeduction({
                userId: user.id,
                businessId: selectedBusinessId,
                amount: parseInt(newDeductionAmount),
                reason: newDeductionReason || 'Deducción',
                date: targetDate,
                createdAt: new Date().toISOString()
            });

            setNewDeductionAmount('');
            setNewDeductionReason('');

            // Refresh
            const userDeductions = await api.getDeductions(user.id, selectedBusinessId);
            setDeductions(userDeductions);
            toast.success('Deducción registrada', {
                description: `Se registró una deducción de ₡${fmtPlain(parseInt(newDeductionAmount))}`
            });
        } catch (error) {
            console.error("Failed to create deduction", error);
            toast.error('Error al registrar deducción');
        }
    };

    // Deduction Delete Modal State
    const [deductionToDelete, setDeductionToDelete] = React.useState<string | null>(null);

    const handleDeleteDeduction = (id: string) => {
        setDeductionToDelete(id);
    };

    const confirmDeleteDeduction = async () => {
        if (!deductionToDelete || !selectedBusinessId) return;
        try {
            await api.deleteDeduction(deductionToDelete);
            const userDeductions = await api.getDeductions(user!.id, selectedBusinessId);
            setDeductions(userDeductions);
            setDeductionToDelete(null);
            toast.success('Deducción eliminada');
        } catch (error) {
            console.error("Failed to delete deduction", error);
            toast.error('Error al eliminar deducción');
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
                {/* Manual Adjustments Removed */}
            </div>

            <div className="flex-1 px-5 space-y-6">

                {/* Main KPI Card */}
                {/* Main KPI Card */}
                <Card className="p-6 rounded-3xl border-none shadow-xl shadow-blue-900/5 bg-gradient-primary text-white relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/3 blur-2xl" />

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-blue-100 uppercase tracking-widest">Ganancia Neta</span>
                            <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/10">Actual</span>
                        </div>
                        <div className="mb-8">
                            <span className="text-5xl font-black tracking-tight text-white drop-shadow-sm">
                                {fmt(finalBalance)}
                            </span>
                        </div>

                        <div className="grid grid-cols-3 gap-y-4 gap-x-2 border-t border-white/20 pt-5">
                            <div>
                                <p className="text-[10px] font-bold text-blue-100 uppercase tracking-wider mb-0.5">Ventas</p>
                                <p className="text-sm font-bold text-white">₡{fmtPlain(totalSales)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-blue-100 uppercase tracking-wider mb-0.5">Premios</p>
                                <p className="text-sm font-bold text-white">₡{fmtPlain(totalPrizes)}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-blue-100 uppercase tracking-wider mb-0.5">Comisión</p>
                                <p className="text-sm font-bold text-white">₡{fmtPlain(totalCommission)}</p>
                            </div>
                            <div className="col-span-3 flex justify-between items-center pt-2 mt-2 border-t border-white/10">
                                <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center">
                                        <Wallet className="h-3 w-3 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-blue-100 uppercase tracking-wider">Adelantos</p>
                                        <p className="text-xs font-bold text-green-300">+₡{fmtPlain(totalAdvances)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-blue-100 uppercase tracking-wider">Deducciones</p>
                                        <p className="text-xs font-bold text-red-300">-₡{fmtPlain(totalDeductions)}</p>
                                    </div>
                                    <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center">
                                        <Banknote className="h-3 w-3 text-white" />
                                    </div>
                                </div>
                            </div>
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

                            const handleSave = async () => {
                                await handleSaveClosure(closure);
                                setExpandedDay(null);
                                toast.success('Guardado correctamente', {
                                    description: `Cierre del ${getDayName(date)} actualizado.`
                                });
                            };

                            return (
                                <Card key={date} className={cn(
                                    "overflow-hidden border-none shadow-sm rounded-2xl bg-white transition-all duration-300",
                                    !isExpanded && "opacity-80 hover:opacity-100 hover:shadow-md",
                                    isExpanded && "shadow-lg ring-1 ring-blue-100"
                                )}>
                                    <button
                                        onClick={() => setExpandedDay(isExpanded ? null : date)}
                                        className="w-full flex items-center justify-between p-5"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "h-12 w-12 flex items-center justify-center rounded-2xl font-bold text-lg transition-colors",
                                                isExpanded ? "bg-blue-600 text-white shadow-blue-200 shadow-lg" : "bg-gray-100 text-gray-500"
                                            )}>
                                                {getDateInitial(date)}
                                            </div>
                                            <div className="text-left">
                                                <p className="font-bold text-gray-900 text-lg">{getDayName(date)}</p>
                                                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{new Date(date).toLocaleDateString('es-ES', { timeZone: 'UTC' })}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {!isExpanded && (
                                                <span className="text-sm font-bold text-gray-900 bg-gray-50 px-2.5 py-1 rounded-lg">₡{fmtPlain(closure.saleTotal)}</span>
                                            )}
                                            {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-300" /> : <ChevronDown className="h-5 w-5 text-gray-300" />}
                                        </div>
                                    </button>

                                    {/* Expanded Content */}
                                    {isExpanded && (
                                        <div className="px-5 pb-5 animate-in slide-in-from-top-2 duration-300 fade-in-50">
                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Venta Total</label>
                                                    <div className="bg-gray-50 rounded-2xl px-2 py-1 border border-transparent focus-within:border-blue-500/20 focus-within:bg-blue-50/50 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                                                        <div className="relative">
                                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold pointer-events-none z-10 text-lg">₡</span>
                                                            <Input
                                                                className="pl-8 border-none bg-transparent shadow-none text-xl font-bold text-gray-900 py-3 pr-3 h-auto focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-full"
                                                                value={closure.saleTotal === 0 ? '' : closure.saleTotal}
                                                                onChange={(e) => handleClosureChange(closure.id, 'saleTotal', e.target.value)}
                                                                type="number"
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Premios Pagados</label>
                                                    <div className="bg-gray-50 rounded-2xl px-2 py-1 border border-transparent focus-within:border-blue-500/20 focus-within:bg-blue-50/50 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                                                        <div className="relative">
                                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold pointer-events-none z-10 text-lg">₡</span>
                                                            <Input
                                                                className="pl-8 border-none bg-transparent shadow-none text-xl font-bold text-gray-900 py-3 pr-3 h-auto focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none w-full"
                                                                value={closure.prizesPaid === 0 ? '' : closure.prizesPaid}
                                                                onChange={(e) => handleClosureChange(closure.id, 'prizesPaid', e.target.value)}
                                                                type="number"
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between mb-4 border border-gray-100">
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Comisión ({(closure.commissionPercentage * 100).toFixed(0)}%)</p>
                                                    <p className="text-lg font-bold text-blue-600">
                                                        {fmt(closure.saleTotal * closure.commissionPercentage)}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Ganancia Día</p>
                                                    <p className={cn("text-2xl font-black tracking-tight", closure.calculatedProfit < 0 ? "text-red-500" : "text-green-600")}>
                                                        {fmt(closure.calculatedProfit)}
                                                    </p>
                                                </div>
                                            </div>

                                            <Button
                                                className="w-full rounded-xl font-bold bg-gray-900 hover:bg-black text-white h-12 shadow-lg hover:shadow-xl transition-all active:scale-95"
                                                onClick={handleSave}
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

                {/* Deductions Section */}
                <div className="pb-4">
                    <div className="flex items-center justify-between px-1 mb-3">
                        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Deducciones</h2>
                        <span className="text-xs font-medium text-gray-500 bg-white border border-gray-100 px-2 py-0.5 rounded-md shadow-sm">
                            Total: ₡{fmtPlain(totalDeductions)}
                        </span>
                    </div>

                    <div className="space-y-3 mb-4">
                        {/* New Deduction Input */}
                        <div className="flex flex-col gap-2 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Motivo (ej: Sinpe, Faltante...)"
                                    className="flex-1 border-gray-100 bg-gray-50/50 text-sm"
                                    value={newDeductionReason}
                                    onChange={(e) => setNewDeductionReason(e.target.value)}
                                />
                                <div className="relative w-32">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₡</span>
                                    <Input
                                        placeholder="0"
                                        className="pl-7 border-gray-100 bg-gray-50/50 text-right font-bold text-sm"
                                        type="number"
                                        value={newDeductionAmount}
                                        onChange={(e) => setNewDeductionAmount(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleCreateDeduction()}
                                    />
                                </div>
                            </div>
                            <Button
                                className="w-full bg-red-50 text-red-600 hover:bg-red-100 border-none font-bold h-9"
                                onClick={handleCreateDeduction}
                                disabled={!newDeductionAmount}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Agregar Deducción
                            </Button>
                        </div>

                        {/* Deductions List */}
                        {weekDeductions.map((ded) => (
                            <Card key={ded.id} className="p-3 rounded-2xl border-none shadow-sm bg-white flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                                        <Banknote className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-sm text-gray-900 truncate">{ded.reason}</p>
                                        <p className="text-[10px] text-gray-400 font-medium">{new Date(ded.date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-red-500">-₡{fmtPlain(ded.amount)}</span>
                                    <button
                                        onClick={() => handleDeleteDeduction(ded.id)}
                                        className="text-gray-300 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </Card>
                        ))}
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
                                        <div className={cn("text-lg font-bold", adv.amount >= 0 ? "text-green-600" : "text-red-500")}>
                                            {adv.amount >= 0 ? '+' : '-'} ₡{fmtPlain(Math.abs(adv.amount))}
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
            <div className="fixed bottom-0 left-0 w-full z-20 pointer-events-none">
                <div className="max-w-md mx-auto px-6 pb-6 pt-0">
                    <div className="bg-white/90 backdrop-blur-xl shadow-2xl border border-white/40 rounded-3xl pointer-events-auto flex justify-between items-center px-6 py-4">
                        <button
                            onClick={onBack}
                            className="flex flex-col items-center gap-1 text-blue-600 transition-colors active:scale-95 duration-200"
                        >
                            <Calendar className="h-6 w-6" />
                            <span className="text-[10px] font-bold">SEMANAS</span>
                        </button>
                        <div className="w-px h-8 bg-gray-100" />
                        <button
                            onClick={() => onNavigate('sales')}
                            className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors active:scale-95 duration-200"
                        >
                            <Wallet className="h-6 w-6" />
                            <span className="text-[10px] font-bold">VENTAS</span>
                        </button>
                        <div className="w-px h-8 bg-gray-100" />
                        <button
                            onClick={() => onNavigate('reports')}
                            className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors active:scale-95 duration-200"
                        >
                            <BarChart3 className="h-6 w-6" />
                            <span className="text-[10px] font-bold">REPORTES</span>
                        </button>
                        <div className="w-px h-8 bg-gray-100" />
                        <button
                            onClick={() => onNavigate('profile')}
                            className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors active:scale-95 duration-200"
                        >
                            <User className="h-6 w-6" />
                            <span className="text-[10px] font-bold">PERFIL</span>
                        </button>
                    </div>
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

            <Modal
                isOpen={!!deductionToDelete}
                onClose={() => setDeductionToDelete(null)}
                title="Eliminar Deducción"
            >
                <div className="space-y-4">
                    <p className="text-gray-600">
                        ¿Estás seguro de que deseas eliminar esta deducción? Esta acción afectará el balance de la semana.
                    </p>
                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            className="flex-1"
                            onClick={() => setDeductionToDelete(null)}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                            onClick={confirmDeleteDeduction}
                            disabled={loading}
                        >
                            Eliminar
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
