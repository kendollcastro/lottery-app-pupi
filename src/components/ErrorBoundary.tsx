import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./ui/Button";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
                    <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-gray-100">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-8 h-8 text-red-500" />
                        </div>
                        <h1 className="text-xl font-bold text-gray-900 mb-2">Algo salió mal</h1>
                        <p className="text-gray-500 mb-6 text-sm">
                            Ha ocurrido un error inesperado en la aplicación.
                        </p>
                        <div className="bg-gray-50 p-3 rounded-xl mb-6 text-left overflow-auto max-h-32">
                            <code className="text-xs text-red-500 font-mono break-all">
                                {this.state.error?.message}
                            </code>
                        </div>
                        <Button
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11"
                            onClick={() => window.location.reload()}
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Recargar Aplicación
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
