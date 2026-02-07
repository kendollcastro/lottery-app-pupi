import * as React from 'react';
import { useAppStore } from '../lib/store';
import { Button } from '../components/ui/Button';
import {
    Loader2,
    Mail,
    Lock,
    Eye,
    EyeOff,
    FileText,
    User,
    ArrowLeft
} from 'lucide-react';

import { supabase } from '../lib/supabase';
import { api } from '../lib/api';

interface RegisterPageProps {
    onBack: () => void;
}

export function RegisterPage({ onBack }: RegisterPageProps) {
    const [name, setName] = React.useState('');
    const [email, setEmail] = React.useState(''); // Changed username to email
    const [password, setPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [showPassword, setShowPassword] = React.useState(false);

    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const { setUser, setSession } = useAppStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            setLoading(false);
            return;
        }

        try {
            const { data, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name: name,
                        username: email.split('@')[0], // Default username
                    }
                }
            });

            if (authError) throw authError;

            if (data.session) {
                setSession(data.session);
                // Profile is created via Trigger on Supabase side
                // Wait a bit or fetch
                const userProfile = await api.getCurrentUser();
                if (userProfile) setUser(userProfile);
            } else if (data.user && !data.session) {
                // Confirmation required case
                setError('Revisa tu correo para confirmar la cuenta');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error al registrar usuario');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB] p-4 font-sans">
            <div className="w-full max-w-sm animate-in fade-in zoom-in-95 duration-500">

                <div className="mb-6">
                    <Button
                        variant="ghost"
                        className="pl-0 text-gray-500 hover:text-gray-900 hover:bg-transparent"
                        onClick={onBack}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver al inicio de sesión
                    </Button>
                </div>

                {/* Logo Section */}
                <div className="flex flex-col items-center mb-8">
                    <div className="h-16 w-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4 text-blue-600">
                        <FileText className="h-8 w-8" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Crear Cuenta</h1>
                    <p className="text-gray-500 text-center text-sm">
                        Únete para gestionar tus finanzas
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Name Input */}
                    <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-bold text-gray-700 ml-1">
                            Nombre Completo
                        </label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <User className="h-5 w-5" />
                            </div>
                            <input
                                id="name"
                                type="text"
                                placeholder="Juan Pérez"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                required
                            />
                        </div>
                    </div>

                    {/* Username/Email Input */}
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-bold text-gray-700 ml-1">
                            Email
                        </label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <Mail className="h-5 w-5" />
                            </div>
                            <input
                                id="email"
                                type="email"
                                placeholder="ejemplo@correo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                required
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div className="space-y-2">
                        <label htmlFor="password" className="text-sm font-bold text-gray-700 ml-1">
                            Contraseña
                        </label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <Lock className="h-5 w-5" />
                            </div>
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full h-12 pl-10 pr-10 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password Input */}
                    <div className="space-y-2">
                        <label htmlFor="confirmPassword" className="text-sm font-bold text-gray-700 ml-1">
                            Confirmar Contraseña
                        </label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <Lock className="h-5 w-5" />
                            </div>
                            <input
                                id="confirmPassword"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full h-12 pl-10 pr-10 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium flex items-center justify-center animate-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full h-12 rounded-xl text-base font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 transition-all active:scale-[0.98] mt-2"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                        {loading ? 'Creando cuenta...' : 'Registrarse'}
                    </Button>
                </form>

            </div>
        </div>
    );
}
