import {
  createContext,
  useCallback,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { ApiError } from "@/api/types";
import { CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";

/* ─── Types ──────────────────────────────────── */

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
}

/* ─── Store (outside React, callable from anywhere) ─── */

type Listener = () => void;

let toasts: Toast[] = [];
let counter = 0;
const listeners = new Set<Listener>();

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): Toast[] {
  return toasts;
}

function emit(): void {
  listeners.forEach((l) => l());
}

function addToast(type: ToastType, message: string, duration: number): void {
  const id = `toast-${++counter}`;
  toasts = [...toasts, { id, type, message, duration }];
  emit();
  if (duration > 0) {
    setTimeout(() => removeToast(id), duration);
  }
}

function removeToast(id: string): void {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

/* ─── Public API ─────────────────────────────── */

export function showSuccess(message: string): void {
  addToast("success", message, 3000);
}

export function showError(message: string): void {
  addToast("error", message, 4000);
}

export function showInfo(message: string): void {
  addToast("info", message, 3000);
}

export function showWarning(message: string): void {
  addToast("warning", message, 4000);
}

export function showApiError(err: unknown, fallback?: string): void {
  const apiErr = err as ApiError;
  const message =
    apiErr?.message || fallback || "Erro inesperado. Tente novamente.";
  showError(message);
}

/* ─── React Context ──────────────────────────── */

interface ToastContextValue {
  toasts: Toast[];
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToastNative(): ToastContextValue {
  const t = useSyncExternalStore(subscribe, getSnapshot);
  const dismiss = useCallback((id: string) => removeToast(id), []);
  return { toasts: t, dismiss };
}

/* ─── Type icons & styles ────────────────────── */

const TYPE_CONFIG = {
  success: {
    icon: CheckCircle,
    containerClass: "bg-[#0a1128] border-[rgba(204,255,0,0.3)]",
    iconClass: "text-[#ccff00]",
  },
  error: {
    icon: XCircle,
    containerClass: "bg-[#1a0a0a] border-[rgba(255,107,107,0.3)]",
    iconClass: "text-[#ff6b6b]",
  },
  info: {
    icon: Info,
    containerClass: "bg-[#0a1128] border-[rgba(227,226,253,0.25)]",
    iconClass: "text-[#E3E2FD]",
  },
  warning: {
    icon: AlertTriangle,
    containerClass: "bg-[#1a1400] border-[rgba(255,215,0,0.3)]",
    iconClass: "text-[#ffd700]",
  },
} as const;

/* ─── ToastProvider — mounts at app root ─────── */

export function ToastProvider({ children }: { children: ReactNode }) {
  const { toasts, dismiss } = useToastNative();

  return (
    <ToastContext.Provider value={{ toasts, dismiss }}>
      {children}
      {/* Toast container — portal rendered at the document body level */}
      <div
        id="cloudbuilder-toast-root"
        className="fixed bottom-4 right-4 z-[9999] flex flex-col-reverse gap-2 pointer-events-none"
      >
        {toasts.map((t) => {
          const cfg = TYPE_CONFIG[t.type];
          const Icon = cfg.icon;
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium min-w-[280px] max-w-[400px] animate-in slide-in-from-right-2 fade-in duration-200 ${cfg.containerClass}`}
              style={{ color: "#fff" }}
            >
              <Icon className={`w-5 h-5 shrink-0 ${cfg.iconClass}`} />
              <span className="flex-1">{t.message}</span>
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors text-xs"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
