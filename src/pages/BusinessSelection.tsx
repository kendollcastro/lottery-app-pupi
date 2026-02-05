import * as React from 'react';
import { useAppStore } from '../lib/store';
import { Card } from '../components/ui/Card';
import { Store, Plus } from 'lucide-react';
import { cn } from '../lib/utils';

export function BusinessSelectionPage() {
    const { setSelectedBusinessId } = useAppStore();

    // Force light mode cleanup
    React.useEffect(() => {
        document.documentElement.classList.remove('dark');
        localStorage.removeItem('theme');
    }, []);

    const [businesses, setBusinesses] = React.useState([
        { id: 'b1', name: 'Tiempos Pupi #3', active: true },
        { id: 'b2', name: 'Tiempos Pupi #4', active: false },
    ]);
    const [isCreating, setIsCreating] = React.useState(false);
    const [newBusinessName, setNewBusinessName] = React.useState('');

    const handleCreate = () => {
        if (!newBusinessName.trim()) return;

        const newBusiness = {
            id: `b${Date.now()}`,
            name: newBusinessName,
            active: true
        };

        setBusinesses([...businesses, newBusiness]);
        setSelectedBusinessId(newBusiness.id); // Auto-select
        setIsCreating(false);
        setNewBusinessName('');
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#F8F9FB] p-6 transition-colors duration-300">

            {/* Header */}
            <div className="flex justify-between items-center mb-10">
                <div className="h-12 w-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                    <Store className="h-6 w-6 text-white" />
                </div>
            </div>

            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">
                    {isCreating ? 'Nuevo Negocio' : 'Selecciona un Negocio'}
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                    {isCreating ? 'Ingresa el nombre del nuevo punto de venta.' : 'Elige donde quieres trabajar hoy.'}
                </p>
            </div>

            {isCreating ? (
                /* Creation Form */
                <Card className="p-6 border-none shadow-sm rounded-3xl bg-white space-y-6">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Nombre del Negocio</label>
                        <input
                            autoFocus
                            type="text"
                            value={newBusinessName}
                            onChange={(e) => setNewBusinessName(e.target.value)}
                            placeholder="Ej. Tiempos Centro"
                            className="w-full text-lg font-bold border-b-2 border-gray-100 focus:border-blue-600 outline-none py-2 bg-transparent transition-colors"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={() => setIsCreating(false)}
                            className="flex-1 py-3 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={!newBusinessName.trim()}
                            className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200"
                        >
                            Crear
                        </button>
                    </div>
                </Card>
            ) : (
                /* List */
                <div className="space-y-4">
                    {businesses.map((business) => (
                        <Card
                            key={business.id}
                            className={cn(
                                "p-5 flex items-center justify-between border-none shadow-sm cursor-pointer transition-all active:scale-[0.98] group",
                                business.active
                                    ? "bg-white"
                                    : "bg-gray-100 opacity-60"
                            )}
                            onClick={() => setSelectedBusinessId(business.id)}
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "h-10 w-10 rounded-full flex items-center justify-center font-bold text-lg",
                                    business.active
                                        ? "bg-blue-50 text-blue-600"
                                        : "bg-gray-200 text-gray-500"
                                )}>
                                    {business.name.charAt(0)}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                        {business.name}
                                    </span>
                                    <span className={cn(
                                        "text-xs font-medium",
                                        business.active ? "text-green-500" : "text-gray-400"
                                    )}>
                                        {business.active ? 'Activo' : 'Inactivo'}
                                    </span>
                                </div>
                            </div>

                            <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="m9 18 6-6-6-6" /></svg>
                            </div>
                        </Card>
                    ))}

                    {/* Add Business Button */}
                    <button
                        className="w-full p-4 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center gap-2 text-gray-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all group"
                        onClick={() => setIsCreating(true)}
                    >
                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                            <Plus className="h-5 w-5 text-gray-400 group-hover:text-blue-600" />
                        </div>
                        <span className="font-bold">Agregar nuevo negocio</span>
                    </button>
                </div>
            )}
        </div>
    );
}
