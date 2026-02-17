import * as React from 'react';
import { api } from '../lib/api';
import { useAppStore } from '../lib/store';
import type { Week, Advance, DailyClosure } from '../lib/types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import {
    Search,
    MoreHorizontal,
    Trash2,
    Plus,
    Pin,
    Calendar,
    Wallet,
    BarChart3,
    User
} from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface WeekListProps {
    onSelectWeek: (weekId: string) => void;
    onNavigate: (page: 'weeks' | 'sales' | 'reports' | 'profile') => void;
}

export function WeekListPage({ onSelectWeek, onNavigate }: WeekListProps) {
    const { user, selectedBusinessId } = useAppStore(); // Added user from store
    const [weeks, setWeeks] = React.useState<Week[]>([]);
    const [advances, setAdvances] = React.useState<Advance[]>([]); // To show totals
    const [closures, setClosures] = React.useState<DailyClosure[]>([]); // To show commissions
    const [loading, setLoading] = React.useState(true);

    // Modal State
    const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
    const [weekToDelete, setWeekToDelete] = React.useState<string | null>(null);

    const init = async () => {
        if (!user || !selectedBusinessId) return;
        setLoading(true);
        try {
            const [data, userAdvances, userClosures] = await Promise.all([
                api.getWeeks(selectedBusinessId),
                api.getAdvances(user.id, selectedBusinessId),
                api.getAllClosures(user.id, selectedBusinessId)
            ]);
            setWeeks(data);
            setAdvances(userAdvances);
            setClosures(userClosures);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        init();
    }, [user?.id, selectedBusinessId]); // Dependency on user ID only

    const getWeekAdvancesTotal = (week: Week) => {
        return advances
            .filter(a => a.date >= week.startDate && a.date <= week.endDate)
            .reduce((sum, a) => sum + a.amount, 0);
    };

    const getWeekCommissionTotal = (week: Week) => {
        return closures
            .filter(c => c.date >= week.startDate && c.date <= week.endDate)
            .reduce((sum, c) => sum + (c.saleTotal * c.commissionPercentage), 0);
    };

    // Create Week State
    const [createModalOpen, setCreateModalOpen] = React.useState(false);
    const [newWeekName, setNewWeekName] = React.useState('');
    const [newWeekDate, setNewWeekDate] = React.useState('');
    const [creating, setCreating] = React.useState(false);

    const handleCreateWeek = () => {
        // Basic role check on client side (RLS enforces on server)
        if (user?.role !== 'admin') {
            alert("Solo los administradores pueden crear semanas.");
            return;
        }

        // Default to next Monday or today if it's Monday
        const today = new Date();
        const day = today.getDay();
        const diff = day === 1 ? 0 : (day === 0 ? 1 : 8 - day); // If Sunday (0), +1. If Mon(1), +0. Else next Mon.
        const nextMonday = new Date(today);
        nextMonday.setDate(today.getDate() + diff);

        setNewWeekDate(nextMonday.toISOString().split('T')[0]);
        setNewWeekName(`Semana del ${nextMonday.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`);
        setCreateModalOpen(true);
    };

    const executeCreateWeek = async () => {
        if (!newWeekDate || !newWeekName || !selectedBusinessId) return;
        setCreating(true);
        try {
            const start = new Date(newWeekDate);
            // Ensure end date is +6 days (Sunday)
            const end = new Date(start);
            end.setDate(start.getDate() + 6);

            await api.createWeek({
                businessId: selectedBusinessId, // [NEW]
                name: newWeekName,
                startDate: newWeekDate,
                endDate: end.toISOString().split('T')[0],
                status: 'active',
                isPinned: false
            });

            await init();
            setCreateModalOpen(false);
            toast.success('Semana creada exitosamente');
        } catch (error) {
            console.error("Failed to create week:", error);
            toast.error('Error al crear semana');
        } finally {
            setCreating(false);
        }
    };

    const confirmDelete = (e: React.MouseEvent, weekId: string) => {
        e.stopPropagation();
        setWeekToDelete(weekId);
        setDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if (!weekToDelete) return;

        // Basic role check
        if (user?.role !== 'admin') {
            alert("Eliminar semanas es solo para administradores.");
            return;
        }

        try {
            await api.deleteWeek(weekToDelete);
            // Optimistic update or refresh
            await init();
            setDeleteModalOpen(false);
            setWeekToDelete(null);
            toast.success('Semana eliminada');
        } catch (err: any) {
            console.error("Failed to delete week", err);
            toast.error(`Error al eliminar: ${err.message || 'Error desconocido'}`);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#F8F9FB] pb-20 transition-colors duration-300">

            {/* Create Week Modal */}
            <Modal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                title="Nueva Semana"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setCreateModalOpen(false)}>Cancelar</Button>
                        <Button
                            className="bg-blue-600 text-white hover:bg-blue-700"
                            onClick={executeCreateWeek}
                            disabled={creating || !newWeekName || !newWeekDate}
                        >
                            {creating ? 'Creando...' : 'Crear Semana'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Semana</label>
                        <Input
                            value={newWeekName}
                            onChange={(e) => setNewWeekName(e.target.value)}
                            placeholder="Ej: Semana 10 - Octubre"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Inicio (Lunes)</label>
                        <Input
                            type="date"
                            value={newWeekDate}
                            onChange={(e) => setNewWeekDate(e.target.value)}
                        />
                        <p className="text-xs text-gray-400 mt-1">La fecha de fin se calculará automáticamente (Domingo).</p>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="¿Eliminar semana?"
                description="Esta acción no se puede deshacer. Se perderán todos los datos asociados a esta semana."
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setDeleteModalOpen(false)}>Cancelar</Button>
                        <Button variant="danger" onClick={executeDelete}>Eliminar</Button>
                    </>
                }
            />

            {/* Header */}
            <div className="px-5 pt-6 pb-2 mb-2 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Lista de Semanas</h1>

                <Button variant="ghost" size="icon" className="rounded-full bg-gray-100 hover:bg-gray-200">
                    <MoreHorizontal className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </Button>

            </div>

            {/* Search Bar */}
            <div className="px-5 mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        className="pl-9 h-11 rounded-xl bg-gray-100/50 border-transparent focus:bg-white transition-all placeholder:text-gray-400"
                        placeholder="Buscar semana..."
                    />
                </div>
            </div>

            {/* Week List */}
            <div className="flex-1 px-5 space-y-4">
                {loading ? (
                    <div className="py-10 text-center text-gray-400">Cargando semanas...</div>
                ) : weeks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                        <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                            <Calendar className="h-6 w-6 text-blue-500" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">No hay semanas registradas</h3>
                        <p className="text-gray-500 mb-6 max-w-xs mx-auto">
                            Comienza creando tu primera semana de ventas para empezar a registrar cierres.
                        </p>
                        <Button variant="secondary" className="rounded-full px-6 bg-blue-50 text-blue-600 border-none hover:bg-blue-100" onClick={init}>
                            Recargar
                        </Button>
                    </div>
                ) : (
                    weeks.map((week) => (
                        <div key={week.id} className="group flex items-center gap-3">
                            {/* Main Card */}
                            <Card
                                className={cn(
                                    "flex-1 overflow-hidden border-none shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] rounded-2xl bg-white ios-active cursor-pointer hover:shadow-md transition-all"
                                )}
                                onClick={() => onSelectWeek(week.id)}
                            >
                                {/* Status Header Strip */}
                                <div className={cn(
                                    "px-4 py-1.5 flex items-center justify-between",
                                    week.status === 'active'
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-100 text-gray-500"
                                )}>
                                    <span className="text-[10px] font-bold uppercase tracking-widest">
                                        {week.status === 'active' ? 'Actual' : 'Finalizada'}
                                    </span>
                                    {week.isPinned && <Pin className="h-3 w-3 fill-white" />}
                                </div>

                                <div className="p-4 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-1 leading-tight">
                                            {week.name}
                                        </h3>
                                        {/* Simple date formatting for range display */}
                                        <p className="text-xs text-gray-400 font-medium">
                                            {week.startDate} - {week.endDate}
                                        </p>

                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {/* Commission Summary - NEW */}
                                            <div className="inline-flex items-center gap-1.5 bg-blue-50 px-2.5 py-1 rounded-lg">
                                                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wide">
                                                    Comisión
                                                </span>
                                                <div className="h-3 w-px bg-blue-200" />
                                                <span className="text-xs font-bold text-blue-600">
                                                    ₡{getWeekCommissionTotal(week).toLocaleString('es-CR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                                </span>
                                            </div>

                                            {/* Advances Summary */}
                                            {getWeekAdvancesTotal(week) > 0 && (
                                                <div className="inline-flex items-center gap-1.5 bg-red-50 px-2.5 py-1 rounded-lg">
                                                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide">
                                                        Adelantos
                                                    </span>
                                                    <div className="h-3 w-px bg-red-200" />
                                                    <span className="text-xs font-bold text-red-600">
                                                        ₡{getWeekAdvancesTotal(week).toLocaleString('es-CR')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-gray-300">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 opacity-20"><path d="m9 18 6-6-6-6" /></svg>
                                    </div>
                                </div>
                            </Card>

                            {/* Delete Action (Always visible) */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-12 w-12 shrink-0 rounded-2xl bg-red-50 text-red-500 hover:bg-red-100"
                                onClick={(e) => confirmDelete(e, week.id)}
                            >
                                <Trash2 className="h-5 w-5" />
                            </Button>
                        </div>
                    ))
                )}
            </div>

            {/* Floating Action Button */}
            <div className="fixed bottom-24 right-5 z-20">
                <Button
                    className="h-12 px-6 rounded-full shadow-xl bg-blue-600 hover:bg-blue-700 flex items-center gap-2 disabled:opacity-70"
                    onClick={handleCreateWeek}
                >
                    <Plus className="h-5 w-5 text-white" />
                    <span className="font-bold text-white">Nueva Semana</span>
                </Button>
            </div>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 w-full z-20 pointer-events-none">
                <div className="max-w-md mx-auto px-6 pb-6 pt-0">
                    <div className="bg-white/90 backdrop-blur-xl shadow-2xl border border-white/40 rounded-3xl pointer-events-auto flex justify-between items-center px-6 py-4">
                        <button
                            onClick={() => onNavigate('weeks')}
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

        </div>
    );
}
