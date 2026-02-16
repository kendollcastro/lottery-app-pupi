import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { LogOut, User as UserIcon, Calendar, Wallet, BarChart3, Percent } from 'lucide-react';
import { useAppStore } from '../lib/store';

interface ProfilePageProps {
    onNavigate: (page: 'weeks' | 'sales' | 'reports' | 'profile') => void;
}

export function ProfilePage({ onNavigate }: ProfilePageProps) {
    const { user, logout, defaultCommission, setDefaultCommission } = useAppStore();

    const handleCommissionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val)) {
            setDefaultCommission(val / 100);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#F8F9FB] pb-20">

            {/* Header */}
            <div className="px-5 pt-6 pb-6">
                <h1 className="text-2xl font-bold text-gray-900">Perfil</h1>
            </div>

            <div className="flex-1 px-5 space-y-6">
                {/* User Info Card */}
                <div className="flex flex-col items-center justify-center py-8">
                    <div className="h-28 w-28 rounded-full bg-gradient-to-br from-blue-100 to-white p-1 shadow-2xl shadow-blue-900/10 mb-5 relative">
                        <div className="h-full w-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                            <UserIcon className="h-12 w-12 text-blue-600" />
                        </div>
                        <div className="absolute bottom-1 right-1 bg-blue-600 text-white p-1.5 rounded-full border-4 border-[#F8F9FB]">
                            <UserIcon className="h-3 w-3" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">{user?.name || 'Usuario'}</h2>
                    <p className="text-sm text-gray-400 font-bold mb-3">@{user?.username}</p>
                    <span className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
                        {user?.role || 'User'}
                    </span>
                </div>

                {/* Settings Section */}
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl p-6 shadow-sm">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Configuración General</h3>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                                    <Percent className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">Comisión por Defecto</p>
                                    <p className="text-xs text-gray-400 font-medium mt-0.5">Valor inicial para nuevos días</p>
                                </div>
                            </div>
                            <div className="w-24">
                                <div className="relative group">
                                    <Input
                                        type="number"
                                        className="pr-7 text-right font-black text-lg h-12 bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-purple-100 transition-all rounded-xl"
                                        value={Math.round(defaultCommission * 100)}
                                        onChange={handleCommissionChange}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm pointer-events-none group-focus-within:text-purple-500">%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Logout Button */}
                    <Button
                        variant="ghost"
                        className="w-full h-14 rounded-3xl flex items-center justify-center gap-2 font-bold text-red-500 hover:bg-red-50 hover:text-red-600 transition-all"
                        onClick={logout}
                    >
                        <LogOut className="h-5 w-5" />
                        Cerrar Sesión
                    </Button>
                </div>

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
                            onClick={() => onNavigate('reports')}
                            className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors active:scale-95 duration-200"
                        >
                            <BarChart3 className="h-6 w-6" />
                            <span className="text-[10px] font-bold">REPORTES</span>
                        </button>
                        <div className="w-px h-8 bg-gray-100" />
                        <button
                            onClick={() => onNavigate('profile')}
                            className="flex flex-col items-center gap-1 text-blue-600 transition-colors active:scale-95 duration-200"
                        >
                            <UserIcon className="h-6 w-6" />
                            <span className="text-[10px] font-bold">PERFIL</span>
                        </button>
                    </div>
                </div>
            </div>

        </div >
    );
}
