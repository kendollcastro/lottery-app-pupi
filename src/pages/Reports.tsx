import * as React from 'react';
import { useAppStore } from '../lib/store';
import { mockApi } from '../lib/mockApi';
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
    LineChart,
    Line,
    AreaChart,
    Area
} from 'recharts';
import {
    ArrowLeft,
    TrendingUp,
    DollarSign,
    Award,
    Calendar,
    PieChart,
    Download
} from 'lucide-react';
import { cn } from '../lib/utils';

interface ReportsPageProps {
    onNavigate: (page: 'weeks' | 'sales' | 'reports' | 'profile') => void;
}

export function ReportsPage({ onNavigate }: ReportsPageProps) {
    const { user } = useAppStore();
    const [closures, setClosures] = React.useState<DailyClosure[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [range, setRange] = React.useState<'week' | 'month' | 'year'>('month');

    React.useEffect(() => {
        const loadData = async () => {
            if (!user) return;
            setLoading(true);
            try {
                // Fetch all raw data and filter client-side for now
                const data = await mockApi.getAllClosures(user.id);
                // Sort by date asc
                data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                setClosures(data);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [user]);

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
        <div className="flex flex-col h-full bg-[#F8F9FB] animate-in fade-in duration-300">
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
                    <Card className="p-4 border-none shadow-sm bg-blue-600 text-white rounded-2xl">
                        <div className="flex items-center gap-3 mb-2 opacity-90">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider">Ganancia</span>
                        </div>
                        <p className="text-2xl font-extrabold tracking-tight">
                            {fmt(stats.totalProfit)}
                        </p>
                    </Card>

                    <Card className="p-4 border-none shadow-sm bg-white rounded-2xl">
                        <div className="flex items-center gap-3 mb-2 text-gray-500">
                             <div className="p-2 bg-gray-100 rounded-lg">
                                <DollarSign className="h-5 w-5 text-gray-600" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider">Ventas</span>
                        </div>
                        <p className="text-2xl font-extrabold tracking-tight text-gray-900">
                             {fmt(stats.totalSales)}
                        </p>
                    </Card>

                    <Card className="p-4 border-none shadow-sm bg-white rounded-2xl">
                        <div className="flex items-center gap-3 mb-2 text-gray-500">
                             <div className="p-2 bg-gray-100 rounded-lg">
                                <Award className="h-5 w-5 text-gray-600" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider">Premios</span>
                        </div>
                        <p className="text-2xl font-extrabold tracking-tight text-gray-900">
                             {fmt(stats.totalPrizes)}
                        </p>
                    </Card>

                    <Card className="p-4 border-none shadow-sm bg-white rounded-2xl">
                        <div className="flex items-center gap-3 mb-2 text-gray-500">
                             <div className="p-2 bg-gray-100 rounded-lg">
                                <PieChart className="h-5 w-5 text-gray-600" />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider">Comisión</span>
                        </div>
                        <p className="text-2xl font-extrabold tracking-tight text-gray-900">
                             {fmt(stats.totalCommission)}
                        </p>
                    </Card>
                </div>

                {/* Charts */}
                <Card className="p-5 border-none shadow-sm rounded-3xl bg-white">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Tendencia de Ganancia</h3>
                        <Button variant="ghost" size="sm" className="text-gray-400">
                            <Download className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis 
                                    dataKey="date" 
                                    tick={{fontSize: 10, fill: '#9ca3af'}} 
                                    axisLine={false}
                                    tickLine={false}
                                    tickMargin={10}
                                />
                                <YAxis 
                                    tick={{fontSize: 10, fill: '#9ca3af'}} 
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(val) => `₡${fmtCompact(val)}`}
                                />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    formatter={(value: number) => [`₡${value.toLocaleString()}`, '']}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="Ganancia" 
                                    stroke="#2563eb" 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#colorProfit)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                 <Card className="p-5 border-none shadow-sm rounded-3xl bg-white">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Ventas vs Premios</h3>
                    </div>
                    <div className="h-64 w-full">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis 
                                    dataKey="date" 
                                    tick={{fontSize: 10, fill: '#9ca3af'}} 
                                    axisLine={false}
                                    tickLine={false}
                                    tickMargin={10}
                                />
                                <YAxis 
                                    tick={{fontSize: 10, fill: '#9ca3af'}} 
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(val) => `₡${fmtCompact(val)}`}
                                />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="Ventas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Premios" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
        </div>
    );
}
