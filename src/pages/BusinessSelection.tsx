import * as React from 'react';
import { api } from '../lib/api';
import { useAppStore } from '../lib/store';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Store, Plus } from 'lucide-react';
import { cn } from '../lib/utils';

export function BusinessSelectionPage() {
    const { user, setSelectedBusinessId } = useAppStore();

    // Force light mode cleanup
    React.useEffect(() => {
        document.documentElement.classList.remove('dark');
        localStorage.removeItem('theme');
    }, []);

    const [businesses, setBusinesses] = React.useState<any[]>([]); // Use strict type if available
    const [loading, setLoading] = React.useState(true);
    const [isCreating, setIsCreating] = React.useState(false);
    const [newBusinessName, setNewBusinessName] = React.useState('');
    const [businessToDelete, setBusinessToDelete] = React.useState<any>(null);

    // Load businesses
    React.useEffect(() => {
        if (!user) return;
        const load = async () => {
            try {
                const data = await api.getBusinesses(user.id);
                setBusinesses(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [user]);

    const handleCreate = async () => {
        if (!newBusinessName.trim() || !user) return;

        try {
            const newBiz = await api.createBusiness(user.id, newBusinessName);
            setBusinesses([newBiz, ...businesses]);
            setSelectedBusinessId(newBiz.id); // Auto-select
            setIsCreating(false);
            setNewBusinessName('');
        } catch (e) {
            console.error(e);
            alert('Error al crear negocio');
        }
    };

    const handleDeleteClick = (e: React.MouseEvent, business: any) => {
        e.stopPropagation();
        setBusinessToDelete(business);
    };

    const confirmDelete = async () => {
        if (!businessToDelete) return;
        try {
            await api.deleteBusiness(businessToDelete.id);
            setBusinesses(prev => prev.filter(b => b.id !== businessToDelete.id));
            setBusinessToDelete(null);
        } catch (e) {
            console.error(e);
            alert('Error al eliminar negocio');
            setBusinessToDelete(null);
        }
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
                    {loading && <p className="text-center text-gray-400">Cargando negocios...</p>}

                    {!loading && businesses.length === 0 && (
                        <div className="text-center py-10">
                            <p className="text-gray-400 mb-4">No tienes negocios registrados.</p>
                        </div>
                    )}

                    {businesses.map((business) => (
                        <Card
                            key={business.id}
                            className={cn(
                                "p-5 flex items-center justify-between border-none shadow-sm cursor-pointer transition-all active:scale-[0.98] group bg-white hover:shadow-md"
                            )}
                            onClick={() => setSelectedBusinessId(business.id)}
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "h-10 w-10 rounded-full flex items-center justify-center font-bold text-lg bg-blue-50 text-blue-600"
                                )}>
                                    {business.name.charAt(0)}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                        {business.name}
                                    </span>
                                    <span className="text-xs font-medium text-green-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                        Seleccionar
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={(e) => handleDeleteClick(e, business)}
                                className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M3 6h18" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                            </button>
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

            <Modal
                isOpen={!!businessToDelete}
                onClose={() => setBusinessToDelete(null)}
                title="Eliminar Negocio"
                description={`¿Estás seguro de que deseas eliminar "${businessToDelete?.name}"? Esta acción no se puede deshacer y borrará todos los datos asociados.`}
                footer={
                    <div className="flex justify-end gap-3 w-full">
                        <Button variant="ghost" onClick={() => setBusinessToDelete(null)} className="font-bold">
                            Cancelar
                        </Button>
                        <Button variant="danger" onClick={confirmDelete} className="font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg">
                            Eliminar
                        </Button>
                    </div>
                }
            />
        </div>
    );
}
