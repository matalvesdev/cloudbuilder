import { Component, type ReactNode, type ErrorInfo } from "react";
import { AlertTriangle, RefreshCw, Home, Cloud } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  moduleName?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    console.error(
      `[ErrorBoundary${this.props.moduleName ? ` - ${this.props.moduleName}` : ""}]:`,
      error,
      errorInfo,
    );
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center h-full min-h-[300px] p-6">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <h2 className="text-lg font-bold text-brand-navy font-display mb-2">
              {this.props.moduleName
                ? `Erro no módulo ${this.props.moduleName}`
                : "Algo deu errado"}
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              Ocorreu um erro inesperado ao carregar este componente. Tente
              recarregar a página ou voltar ao dashboard.
            </p>
            {this.state.error && (
              <details className="mb-6 text-left">
                <summary className="text-xs font-medium text-slate-400 cursor-pointer hover:text-slate-600">
                  Detalhes técnicos
                </summary>
                <pre className="mt-2 text-[10px] bg-slate-50 rounded-lg p-3 text-red-600 overflow-auto max-h-[120px] border border-slate-100">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg text-xs font-bold bg-brand-navy text-white hover:bg-brand-navy/90 transition-all shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Tentar novamente
              </button>
              <button
                onClick={this.handleReload}
                className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
              >
                <Home className="w-3.5 h-3.5" />
                Recarregar
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Wraps React.lazy components with Suspense + ErrorBoundary.
 * Use this for each lazy-loaded module in App.tsx.
 */
export function withModuleGuard<T extends Record<string, any>>(
  Component: React.LazyExoticComponent<React.ComponentType<T>>,
  moduleName: string,
  fallback?: ReactNode,
) {
  return function ModuleGuard(props: T) {
    return (
      <ErrorBoundary moduleName={moduleName}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
