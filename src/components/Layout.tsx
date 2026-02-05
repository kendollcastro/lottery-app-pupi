import * as React from 'react';
import { useAppStore } from '../lib/store';
import { Button } from './ui/Button';
import { LogOut } from 'lucide-react';

interface LayoutProps {
    children: React.ReactNode;
    showLogout?: boolean;
}

export function Layout({ children, showLogout = true }: LayoutProps) {
    const { user, setUser, setSelectedBusinessId } = useAppStore();

    const handleLogout = () => {
        setUser(null);
        setSelectedBusinessId(null);
    };

    return (
        <div className="min-h-screen bg-[#F8F9FB] flex flex-col font-sans text-gray-900 transition-colors duration-300">
            {/* Header */}
            <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 px-4 py-3 backdrop-blur-md">
                <div className="mx-auto flex max-w-2xl items-center justify-between">
                    <h1 className="text-lg font-bold tracking-tight text-gray-900">
                        Lotería
                    </h1>
                    {showLogout && user && (
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-600">
                                {user.name}
                            </span>
                            <Button variant="ghost" size="icon" onClick={handleLogout} className="p-2" aria-label="Logout">
                                <LogOut className="h-5 w-5" />
                            </Button>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 px-4 py-6">
                <div className="mx-auto max-w-2xl space-y-6">
                    {children}
                </div>
            </main>
        </div>
    );
}
