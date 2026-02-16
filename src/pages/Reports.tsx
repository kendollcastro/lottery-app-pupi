import * as React from 'react';
import { useAppStore } from '../lib/store';
import { api } from '../lib/api';
import type { DailyClosure } from '../lib/types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import {
    DollarSign,
    Award,
    PieChart,
    Calendar,
    Wallet,
    BarChart3,
    User,
    ArrowLeft,
    TrendingUp
} from 'lucide-react';
import { cn } from '../lib/utils';

interface ReportsPageProps {
    onNavigate: (page: 'weeks' | 'sales' | 'reports' | 'profile') => void;
}

export function ReportsPage({ onNavigate }: ReportsPageProps) {
    const { user, selectedBusinessId } = useAppStore();
    const [closures, setClosures] = React.useState<DailyClosure[]>([]);
    // const [loading, setLoading] = React.useState(true); // Unused
    const [range, setRange] = React.useState<'week' | 'month' | 'year'>('month');

    React.useEffect(() => {
        const loadData = async () => {
            if (!user || !selectedBusinessId) return;
            // setLoading(true);
            try {
                // Fetch all raw data and filter client-side for now
                const data = await api.getAllClosures(user.id, selectedBusinessId);
                // Sort by date asc
                data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                setClosures(data);
            } finally {
                // setLoading(false);
            }
        };
        loadData();
    }, [user, selectedBusinessId]);

    // Helpers
    const fmt = (n: number) => new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(n);
    const fmtCompact = (n: number) => new Intl.NumberFormat('es-CR', { notation: 'compact', compactDisplay: 'short', maximumFractionDigits: 1 }).format(n);

    // Aggregation Logic
    const stats = React.useMemo(() => {
        // Filter based on range (Mock: just taking all or last 30 days)
        // For 'month', let's take last 30 days.
        // For 'week', last 7 days.
        // For 'year', all time (or last 365).

        const now = new Date();
        const cutoff = new Date();
        if (range === 'week') cutoff.setDate(now.getDate() - 7);
        if (range === 'month') cutoff.setDate(now.getDate() - 30);
        if (range === 'year') cutoff.setFullYear(now.getFullYear() - 1);

        const filtered = closures.filter(c => new Date(c.date) >= cutoff);

        const totalSales = filtered.reduce((s, c) => s + c.saleTotal, 0);
        const totalPrizes = filtered.reduce((s, c) => s + c.prizesPaid, 0);
        const totalProfit = filtered.reduce((s, c) => s + c.calculatedProfit, 0);
        // Approx commission
        const totalCommission = filtered.reduce((s, c) => s + (c.saleTotal * c.commissionPercentage), 0);

        return { totalSales, totalPrizes, totalProfit, totalCommission, filtered };
    }, [closures, range]);

    // Chart Data Preparation
    const chartData = React.useMemo(() => {
        return stats.filtered.map(c => ({
            date: new Date(c.date).toLocaleDateString('es-CR', { day: '2-digit', month: 'short' }),
            fullDate: c.date,
            Ventas: c.saleTotal,
            Premios: c.prizesPaid,
            Ganancia: c.calculatedProfit
        }));
    }, [stats.filtered]);

    return (
        <div className="flex flex-col min-h-screen bg-[#F8F9FB] pb-20 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] z-10">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onNavigate('weeks')}
                        className="rounded-full hover:bg-gray-100"
                    >
                        <ArrowLeft className="h-6 w-6 text-gray-600" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
                        <p className="text-sm text-gray-400 font-medium">Estadísticas generales</p>
                    </div>
                </div>

                <div className="flex bg-gray-100 p-1 rounded-xl">
                    {(['week', 'month', 'year'] as const).map((r) => (
                        <button
                            key={r}
                            onClick={() => setRange(r)}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                                range === r ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            {r === 'week' ? '7 Días' : r === 'month' ? '30 Días' : 'Año'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-6">

                {/* KPI Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <Card className="p-5 border-none shadow-lg shadow-blue-900/5 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-3xl relative overflow-hidden col-span-2">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl" />
                        <div className="flex items-center gap-3 mb-1 opacity-90 relative z-10">
                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                                <TrendingUp className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider text-blue-100">Ganancia Neta</span>
                        </div>
                        <p className="text-4xl font-black tracking-tight relative z-10 mt-2">
                            {fmt(stats.totalProfit)}
                        </p>
                    </Card>

                    <Card className="p-4 border-none shadow-sm bg-white rounded-3xl">
                        <div className="flex items-center gap-3 mb-3 text-gray-500">
                            <div className="p-2.5 bg-blue-50 rounded-xl">
                                <DollarSign className="h-5 w-5 text-blue-600" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider">Ventas</span>
                        </div>
                        <p className="text-xl font-bold tracking-tight text-gray-900">
                            {fmtCompact(stats.totalSales)}
                        </p>
                    </Card>

                    <Card className="p-4 border-none shadow-sm bg-white rounded-3xl">
                        <div className="flex items-center gap-3 mb-3 text-gray-500">
                            <div className="p-2.5 bg-amber-50 rounded-xl">
                                <Award className="h-5 w-5 text-amber-600" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider">Premios</span>
                        </div>
                        <p className="text-xl font-bold tracking-tight text-gray-900">
                            {fmtCompact(stats.totalPrizes)}
                        </p>
                    </Card>

                    <Card className="p-4 border-none shadow-sm bg-white rounded-3xl col-span-2 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-purple-50 rounded-xl">
                                <PieChart className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Comisión Generada</p>
                                <p className="text-lg font-bold text-gray-900">{fmt(stats.totalCommission)}</p>
                            </div>
                        </div>
                        <div className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                            Est.
                        </div>
                    </Card>
                </div>

                {/* Charts */}
                <Card className="p-6 border-none shadow-sm rounded-3xl bg-white">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Tendencia</h3>
                            <p className="text-xs text-gray-400 font-medium mt-0.5">Ganancia en el tiempo</p>
                        </div>
                    </div>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 500 }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickMargin={15}
                                />
                                <YAxis
                                    tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 500 }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(val) => `₡${fmtCompact(val)}`}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)', padding: '12px' }}
                                    itemStyle={{ color: '#1e293b', fontWeight: 'bold', fontSize: '12px' }}
                                    labelStyle={{ color: '#94a3b8', fontSize: '10px', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase' }}
                                    formatter={(value: any) => [`₡${Number(value).toLocaleString()}`, '']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="Ganancia"
                                    stroke="#2563eb"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorProfit)"
                                    activeDot={{ r: 6, strokeWidth: 4, stroke: '#fff' }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="p-6 border-none shadow-sm rounded-3xl bg-white">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Comparativa</h3>
                            <p className="text-xs text-gray-400 font-medium mt-0.5">Ventas vs Premios</p>
                        </div>
                    </div>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }} barGap={4}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 500 }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickMargin={15}
                                />
                                <YAxis
                                    tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 500 }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(val) => `₡${fmtCompact(val)}`}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)', padding: '12px' }}
                                    itemStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                                    labelStyle={{ color: '#94a3b8', fontSize: '10px', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase' }}
                                />
                                <Bar dataKey="Ventas" fill="#3b82f6" radius={[6, 6, 6, 6]} barSize={8} />
                                <Bar dataKey="Premios" fill="#f43f5e" radius={[6, 6, 6, 6]} barSize={8} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
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
                            className="flex flex-col items-center gap-1 text-blue-600 transition-colors active:scale-95 duration-200"
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
        </div>
    );
}
