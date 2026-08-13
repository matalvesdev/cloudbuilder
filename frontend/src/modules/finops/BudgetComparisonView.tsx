import { useEffect } from "react";
import {
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCostStore } from "@/store/costStore";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import type { BudgetAlert } from "@/types/cost.types";

function formatCurrency(value: number): string {
  return `US$ ${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const severityConfig: Record<
  string,
  { label: string; class: string; bgClass: string }
> = {
  WARNING: {
    label: "Atenção",
    class: "text-amber-600 bg-amber-50 border-amber-200",
    bgClass: "bg-amber-500",
  },
  CRITICAL: {
    label: "Crítico",
    class: "text-red-600 bg-red-50 border-red-200",
    bgClass: "bg-red-500",
  },
  EXCEEDED: {
    label: "Excedido",
    class: "text-rose-600 bg-rose-50 border-rose-200",
    bgClass: "bg-rose-500",
  },
};

function BudgetCard({ alert }: { alert: BudgetAlert }) {
  const config = severityConfig[alert.severity] ?? severityConfig.WARNING;
  const isExceeded = alert.severity === "EXCEEDED";
  const isCritical = alert.severity === "CRITICAL";

  return (
    <div className="bg-white rounded-3xl card-shadow border border-slate-100 p-5 space-y-4 transition-all hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              "rounded-xl p-2.5 shrink-0",
              isExceeded
                ? "bg-rose-50"
                : isCritical
                  ? "bg-red-50"
                  : "bg-amber-50",
            )}
          >
            <DollarSign
              className={cn(
                "w-5 h-5",
                isExceeded
                  ? "text-rose-600"
                  : isCritical
                    ? "text-red-600"
                    : "text-amber-600",
              )}
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-brand-navy truncate">
              {alert.budgetName}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Limite: {formatCurrency(alert.limitAmount)}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "text-xs px-2.5 py-1 rounded-full font-medium border shrink-0",
            config.class,
          )}
        >
          {config.label}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Gasto atual</span>
          <span
            className={cn(
              "font-semibold",
              isExceeded
                ? "text-rose-600"
                : isCritical
                  ? "text-red-600"
                  : "text-brand-navy",
            )}
          >
            {formatCurrency(alert.spentAmount)}
          </span>
        </div>

        <div className="relative">
          <Progress
            value={Math.min(alert.usagePct, 100)}
            className={cn(
              "h-2.5 rounded-full",
              isExceeded && "[&>div]:bg-rose-500",
              isCritical && "[&>div]:bg-red-500",
              !isExceeded &&
                !isCritical &&
                alert.usagePct >= 80 &&
                "[&>div]:bg-amber-500",
              !isExceeded &&
                !isCritical &&
                alert.usagePct < 80 &&
                "[&>div]:bg-green-500",
            )}
          />
          {alert.usagePct > 100 && (
            <div
              className="absolute top-0 h-2.5 rounded-full bg-rose-500/30"
              style={{
                left: "100%",
                width: `${Math.min(alert.usagePct - 100, 100)}%`,
              }}
            />
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {alert.usagePct.toFixed(1)}% do limite
          </span>
          {isExceeded && (
            <span className="text-xs font-semibold text-rose-600 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {(alert.usagePct - 100).toFixed(1)}% acima
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function BudgetComparisonView() {
  const {
    budgetAlerts,
    budgetAlertsLoading,
    budgetAlertsError,
    fetchBudgetAlerts,
  } = useCostStore();

  const envId =
    localStorage.getItem("cloudbuilder-active-environment") || "default";

  useEffect(() => {
    fetchBudgetAlerts(envId);
  }, [envId, fetchBudgetAlerts]);

  function handleRefresh() {
    fetchBudgetAlerts(envId);
  }

  if (budgetAlertsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-brand-navy font-display">
              Orçamentos
            </h2>
            <p className="text-sm text-slate-400">
              Comparação de orçamento vs gasto real
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-3xl border border-slate-100 card-shadow p-5 space-y-4"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-2.5 w-full rounded-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (budgetAlertsError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-brand-navy font-display">
              Orçamentos
            </h2>
            <p className="text-sm text-slate-400">
              Comparação de orçamento vs gasto real
            </p>
          </div>
        </div>
        <div className="rounded-2xl bg-red-50 border border-red-200 p-6 text-center">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-red-400" />
          <p className="text-sm font-medium text-red-700 mb-1">
            Erro ao carregar orçamentos
          </p>
          <p className="text-xs text-red-500 mb-4">{budgetAlertsError}</p>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-brand-navy font-display">
            Orçamentos
          </h2>
          <p className="text-sm text-slate-400">
            Comparação de orçamento vs gasto real
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-xs font-semibold text-slate-500 hover:text-brand-navy transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Atualizar
        </button>
      </div>

      {budgetAlerts.length === 0 ? (
        <div className="rounded-2xl bg-slate-50 border border-slate-100 p-12 text-center">
          <DollarSign className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-medium text-slate-500">
            Nenhum orçamento configurado
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Crie orçamentos no módulo de Custos para monitorar seus gastos
          </p>
        </div>
      ) : (
        <>
          {/* Summary stats */}
          {(() => {
            const exceeded = budgetAlerts.filter(
              (a) => a.severity === "EXCEEDED",
            ).length;
            const critical = budgetAlerts.filter(
              (a) => a.severity === "CRITICAL",
            ).length;
            const warning = budgetAlerts.filter(
              (a) => a.severity === "WARNING",
            ).length;
            const totalBudget = budgetAlerts.reduce(
              (s, a) => s + a.limitAmount,
              0,
            );
            const totalSpent = budgetAlerts.reduce(
              (s, a) => s + a.spentAmount,
              0,
            );
            const overallPct =
              totalBudget > 0
                ? ((totalSpent / totalBudget) * 100).toFixed(1)
                : "0.0";

            return (
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white rounded-3xl card-shadow border border-slate-100 p-4 text-center space-y-1">
                  <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                    Total Orçado
                  </p>
                  <p className="text-xl font-bold text-brand-navy">
                    {formatCurrency(totalBudget)}
                  </p>
                </div>
                <div className="bg-white rounded-3xl card-shadow border border-slate-100 p-4 text-center space-y-1">
                  <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                    Total Gasto
                  </p>
                  <p className="text-xl font-bold text-brand-navy">
                    {formatCurrency(totalSpent)}
                  </p>
                </div>
                <div className="bg-white rounded-3xl card-shadow border border-slate-100 p-4 text-center space-y-1">
                  <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                    Utilização
                  </p>
                  <p className="text-xl font-bold text-brand-navy">
                    {overallPct}%
                  </p>
                </div>
                <div className="bg-white rounded-3xl card-shadow border border-slate-100 p-4 text-center space-y-1">
                  <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                    Alertas
                  </p>
                  <p className="text-xl font-bold text-brand-navy flex items-center justify-center gap-2">
                    {exceeded > 0 && (
                      <span className="text-rose-600">
                        {exceeded} excedidos
                      </span>
                    )}
                    {critical > 0 && (
                      <span className="text-red-600">{critical} críticos</span>
                    )}
                    {warning > 0 && (
                      <span className="text-amber-600">{warning} atenção</span>
                    )}
                    {exceeded === 0 &&
                      critical === 0 &&
                      warning === 0 &&
                      "Nenhum"}
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Budget cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgetAlerts.map((alert) => (
              <BudgetCard key={alert.budgetId} alert={alert} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
