import * as React from 'react';

import { Button } from '../components/ui/Button';
import {
    Loader2,
    Mail,
    Lock,
    Eye,
    EyeOff,
    FileText
} from 'lucide-react';
import { cn } from '../lib/utils';

import { supabase } from '../lib/supabase';


export function LoginPage({ onRegisterClick }: { onRegisterClick: () => void }) {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [showPassword, setShowPassword] = React.useState(false);
    const [rememberMe, setRememberMe] = React.useState(false);

    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Safety measure: ensure no stale session exists
            await supabase.auth.signOut();

            const { error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) throw authError;

            // Successful login will trigger onAuthStateChange in App.tsx
            // We just wait for the user to be set in the store, which unmounts this page.

        } catch (err: any) {
            console.error("Login Error:", err);
            setError(err.message === 'Invalid login credentials' ? 'Credenciales incorrectas' : 'Error al iniciar sesión');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8F9FB] p-4 font-sans">
            <div className="w-full max-w-sm animate-in fade-in zoom-in-95 duration-500">

                {/* Logo Section */}
                <div className="flex flex-col items-center mb-8">
                    <div className="h-16 w-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4 text-blue-600">
                        <FileText className="h-8 w-8" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Bienvenido</h1>
                    <p className="text-gray-500 text-center text-sm">
                        Gestión financiera y seguimiento de ventas
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Username/Email Input */}
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-bold text-gray-700 ml-1">
                            Usuario / Email
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
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center ml-1">
                            <label htmlFor="password" className="text-sm font-bold text-gray-700">
                                Contraseña
                            </label>
                            <a href="#" className="text-xs font-medium text-blue-600 hover:text-blue-700">
                                ¿Olvidaste tu contraseña?
                            </a>
                        </div>
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

                    {/* Remember Me Toggle */}
                    <div className="flex items-center justify-between">
                        <label className="text-sm text-gray-600 font-medium">
                            Recuérdame
                        </label>
                        <button
                            type="button"
                            onClick={() => setRememberMe(!rememberMe)}
                            className={cn(
                                "w-11 h-6 rounded-full transition-colors relative focus:outline-none",
                                rememberMe ? "bg-blue-600" : "bg-gray-200"
                            )}
                        >
                            <span
                                className={cn(
                                    "absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm",
                                    rememberMe ? "translate-x-5" : "translate-x-0"
                                )}
                            />
                        </button>
                    </div>

                    {error && (
                        <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium flex items-center justify-center animate-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full h-12 rounded-xl text-base font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                        {loading ? 'Ingresando...' : 'Iniciar Sesión'}
                    </Button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-500">
                        ¿No tienes una cuenta?{' '}
                        <button
                            onClick={onRegisterClick}
                            className="font-bold text-blue-600 hover:text-blue-700 hover:underline"
                        >
                            Regístrate
                        </button>
                    </p>
                </div>

                {/* Removed confusing demo hint */}
                <div className="mt-8 text-center text-xs text-gray-400">
                    <p>Usa tu cuenta registrada</p>
                </div>

            </div>
        </div>
    );
}
