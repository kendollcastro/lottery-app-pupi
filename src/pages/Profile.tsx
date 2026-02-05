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
                <Card className="p-6 border-none shadow-sm rounded-3xl bg-white flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <UserIcon className="h-8 w-8" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{user?.name || 'Usuario'}</h2>
                        <p className="text-sm text-gray-500 font-medium">@{user?.username}</p>
                        <span className="inline-block mt-2 px-3 py-1 bg-gray-100 rounded-full text-xs font-bold uppercase tracking-wider text-gray-500">
                            {user?.role || 'User'}
                        </span>
                    </div>
                </Card>

                {/* Settings Section */}
                <div className="space-y-3">
                    <h3 className="ml-1 text-xs font-bold text-gray-400 uppercase tracking-widest">Configuración</h3>

                    <Card className="p-4 border-none shadow-sm rounded-2xl bg-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                                <Percent className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">Comisión por Defecto</p>
                                <p className="text-xs text-gray-400 font-medium">Se aplica a nuevos registros</p>
                            </div>
                        </div>
                        <div className="w-24">
                            <div className="relative">
                                <Input
                                    type="number"
                                    className="pr-6 text-right font-bold h-10"
                                    value={Math.round(defaultCommission * 100)}
                                    onChange={handleCommissionChange}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">%</span>
                            </div>
                        </div>
                    </Card>

                    {/* Logout Button */}
                    <Button
                        variant="danger"
                        className="w-full h-14 rounded-2xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-red-100"
                        onClick={logout}
                    >
                        <LogOut className="h-5 w-5" />
                        Cerrar Sesión
                    </Button>
                </div>

            </div>


            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 z-10 pb-6 pt-3 px-6">
                <div className="flex justify-between items-center max-w-md mx-auto">
                    <button
                        onClick={() => onNavigate('weeks')}
                        className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-600 transition-colors"
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
                        className="flex flex-col items-center gap-1 text-blue-600"
                    >
                        <UserIcon className="h-6 w-6" />
                        <span className="text-[10px] font-bold">PERFIL</span>
                    </button>
                </div>
            </div>

        </div >
    );
}
