import * as React from 'react';
import { Card } from '../components/ui/Card';
import { useAppStore } from '../lib/store';
import { Wallet, Calendar as CalendarIcon, BarChart3, User as UserIcon, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { api } from '../lib/api';
import type { DailyClosure } from '../lib/types';
import { cn } from '../lib/utils'; // Assuming utils exists

interface SalesPageProps {
    onNavigate: (page: 'weeks' | 'sales' | 'reports' | 'profile') => void;
}

export function SalesPage({ onNavigate }: SalesPageProps) {
    const { user, selectedBusinessId } = useAppStore();
    const [currentDate, setCurrentDate] = React.useState(new Date());
    const [dateRange, setDateRange] = React.useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
    const [closures, setClosures] = React.useState<DailyClosure[]>([]);

    // Fetch closures on mount
    React.useEffect(() => {
        if (user && selectedBusinessId) {
            api.getAllClosures(user.id, selectedBusinessId).then(setClosures);
        }
    }, [user?.id, selectedBusinessId]);

    // Helpers
    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        // 0 = Sunday, 1 = Monday. We want Monday as start (0), so adjust.
        // JS day: 0 (Sun) -> 6, 1 (Mon) -> 0
        let day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
        return day === 0 ? 6 : day - 1;
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const selectMonthToDate = () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        setDateRange({ start, end: now });
        setCurrentDate(start); // Jump to current month
    };

    const handleDateClick = (date: Date) => {
        if (!dateRange.start || (dateRange.start && dateRange.end)) {
            // Start new range
            setDateRange({ start: date, end: date }); // Initially same day
        } else {
            // Completing range?
            if (date < dateRange.start) {
                // Clicked before start -> Reset start
                setDateRange({ start: date, end: date });
            } else {
                // Clicked after start -> Set end
                setDateRange({ ...dateRange, end: date });
            }
        }
    };

    const fmt = (n: number) => new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(n);

    // Calculate totals for range
    const rangeStats = React.useMemo(() => {
        if (!dateRange.start) return { sales: 0, profit: 0 };

        // Normalize checking
        const start = new Date(dateRange.start); start.setHours(0, 0, 0, 0);
        const end = new Date(dateRange.end || dateRange.start); end.setHours(23, 59, 59, 999);

        const filtered = closures.filter(c => {
            const d = new Date(c.date + 'T00:00:00'); // Assuming YYYY-MM-DD
            return d >= start && d <= end;
        });

        return {
            sales: filtered.reduce((acc, c) => acc + c.saleTotal, 0),
            profit: filtered.reduce((acc, c) => acc + (c.calculatedProfit || 0), 0)
        };
    }, [closures, dateRange]);

    const rangeSales = rangeStats.sales;
    const rangeProfit = rangeStats.profit;

    const formatRange = () => {
        if (!dateRange.start) return "Resumen (Seleccione rango)";
        const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
        if (!dateRange.end || dateRange.start.getTime() === dateRange.end.getTime()) {
            return dateRange.start.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
        }
        return `${dateRange.start.toLocaleDateString('es-ES', opts)} - ${dateRange.end.toLocaleDateString('es-ES', opts)}`;
    };

    const renderCalendarDays = () => {
        const daysInMonth = getDaysInMonth(currentDate);
        const startDay = getFirstDayOfMonth(currentDate);
        const days = [];

        // Empty slots
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-10"></div>);
        }

        // Days
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const closure = closures.find(c => c.date === dateStr);

            // Check selection state
            let isSelected = false;
            let isRangeStart = false;
            let isRangeEnd = false;
            let isInRange = false;

            if (dateRange.start) {
                const dTime = date.getTime();
                const sTime = new Date(dateRange.start.getFullYear(), dateRange.start.getMonth(), dateRange.start.getDate()).getTime();
                const eTime = dateRange.end ? new Date(dateRange.end.getFullYear(), dateRange.end.getMonth(), dateRange.end.getDate()).getTime() : sTime;

                if (dTime === sTime) isRangeStart = true;
                if (dTime === eTime) isRangeEnd = true;
                if (dTime >= sTime && dTime <= eTime) isInRange = true;
                isSelected = isRangeStart || isRangeEnd;
            }

            const isToday = new Date().toDateString() === date.toDateString();

            days.push(
                <button
                    key={i}
                    onClick={() => handleDateClick(date)}
                    className={cn(
                        "h-9 w-9 mx-auto flex items-center justify-center text-sm font-medium transition-all relative z-10",
                        // Shape
                        isSelected ? "bg-blue-600 text-white rounded-full shadow-lg shadow-blue-200 z-20 scale-110" : "rounded-full hover:bg-gray-50",
                        // Range connector
                        isInRange && !isSelected ? "bg-blue-50 text-blue-700 rounded-none w-full mx-[-2px]" : "",
                        // Range ends rounding fix
                        isInRange && isRangeStart && !isRangeEnd ? "rounded-l-full rounded-r-none" : "",
                        isInRange && isRangeEnd && !isRangeStart ? "rounded-r-full rounded-l-none" : "",

                        !isInRange && isToday && !isSelected ? "bg-gray-100 text-blue-600 font-bold" : "",
                        closure && !isInRange && !isSelected ? "font-bold text-gray-900" : ""
                    )}
                >
                    {i}
                    {closure && !isSelected && !isInRange && (
                        <div className={cn(
                            "absolute bottom-1 h-1 w-1 rounded-full",
                            (closure.calculatedProfit || 0) >= 0 ? "bg-emerald-400" : "bg-red-400"
                        )} />
                    )}
                </button>
            );
        }
        return days;
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#F8F9FB] pb-20">
            {/* Header */}
            <div className="px-5 pt-6 pb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Ventas</h1>
                    <p className="text-sm text-gray-500 font-medium">Registro de ventas</p>
                </div>
                <Button className="h-10 w-10 rounded-full bg-blue-600 p-0 flex items-center justify-center shadow-lg shadow-blue-200">
                    <Plus className="h-6 w-6 text-white" />
                </Button>
            </div>

            <div className="flex-1 px-5 space-y-6 overflow-y-auto pb-24">
                {/* Month Navigation & Filters */}
                <div className="flex flex-col gap-3 mb-2">
                    <div className="flex items-center justify-between">
                        <button onClick={prevMonth} className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
                            <ChevronLeft className="h-6 w-6" />
                        </button>
                        <div className="flex gap-2">
                            <select
                                value={currentDate.getMonth()}
                                onChange={(e) => setCurrentDate(new Date(currentDate.getFullYear(), parseInt(e.target.value), 1))}
                                className="bg-transparent font-bold text-gray-900 text-lg border-none focus:ring-0 cursor-pointer"
                            >
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i} value={i}>
                                        {new Date(0, i).toLocaleString('es-ES', { month: 'long' })}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={currentDate.getFullYear()}
                                onChange={(e) => setCurrentDate(new Date(parseInt(e.target.value), currentDate.getMonth(), 1))}
                                className="bg-transparent font-bold text-gray-900 text-lg border-none focus:ring-0 cursor-pointer"
                            >
                                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                        <button onClick={nextMonth} className="p-2 rounded-full hover:bg-gray-100 text-gray-600">
                            <ChevronRight className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Quick Filters */}
                    <div className="flex justify-center gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-full px-4 h-7"
                            onClick={selectMonthToDate}
                        >
                            Mes a la fecha
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            className="text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-full px-4 h-7"
                            onClick={() => {
                                const today = new Date();
                                setDateRange({ start: today, end: today });
                                setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
                            }}
                        >
                            Hoy
                        </Button>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="bg-white rounded-3xl p-6 shadow-sm select-none border border-gray-100">
                    {/* Days Header */}
                    <div className="grid grid-cols-7 mb-4 text-center">
                        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => (
                            <span key={d} className="text-xs font-bold text-gray-300 py-1">{d}</span>
                        ))}
                    </div>
                    {/* Days */}
                    <div className="grid grid-cols-7 gap-y-3">
                        {renderCalendarDays()}
                    </div>
                </div>

                {/* Summary Card */}
                <Card className="p-6 border-none shadow-xl shadow-blue-900/5 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-3xl relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/3 blur-2xl" />

                    <div className="relative z-10 flex justify-between items-start pb-4 border-b border-white/20 mb-4">
                        <div>
                            <h3 className="font-bold text-lg text-white">
                                {formatRange()}
                            </h3>
                            <p className="text-xs text-blue-100 font-medium opacity-80">Resumen del periodo</p>
                        </div>
                        {dateRange.start && (
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 text-xs text-blue-100 hover:bg-white/10 hover:text-white"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setDateRange({ start: null, end: null });
                                }}
                            >
                                Limpiar
                            </Button>
                        )}
                    </div>

                    <div className="relative z-10 grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-1">Ventas</p>
                            <p className="text-2xl font-black tracking-tight text-white">
                                {fmt(rangeSales)}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-1">Ganancia</p>
                            <p className="text-2xl font-black tracking-tight text-emerald-300">
                                {fmt(rangeProfit)}
                            </p>
                        </div>
                    </div>

                    {!dateRange.start && (
                        <div className="relative z-10 mt-4 text-center py-2 bg-black/10 rounded-xl border border-white/5">
                            <p className="text-xs text-blue-100 font-medium">Selecciona un rango de fechas para ver el detalle.</p>
                        </div>
                    )}
                </Card>
            </div>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 w-full z-20 pointer-events-none">
                <div className="max-w-md mx-auto px-6 pb-6 pt-0">
                    <div className="bg-white/90 backdrop-blur-xl shadow-2xl border border-white/40 rounded-3xl pointer-events-auto flex justify-between items-center px-6 py-4">
                        <button
                            onClick={() => onNavigate('weeks')}
                            className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors active:scale-95 duration-200"
                        >
                            <CalendarIcon className="h-6 w-6" />
                            <span className="text-[10px] font-bold">SEMANAS</span>
                        </button>
                        <div className="w-px h-8 bg-gray-100" />
                        <button
                            onClick={() => onNavigate('sales')}
                            className="flex flex-col items-center gap-1 text-blue-600 transition-colors active:scale-95 duration-200"
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
                            <UserIcon className="h-6 w-6" />
                            <span className="text-[10px] font-bold">PERFIL</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
