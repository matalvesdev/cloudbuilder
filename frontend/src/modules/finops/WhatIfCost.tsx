import { useState, useMemo } from "react";
import {
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Server,
  Database,
  Globe,
  Cpu,
  DollarSign,
  AlertTriangle,
  Calculator,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCanvasStore } from "@/store/canvasStore";
import { useCostStore } from "@/store/costStore";
import { Card } from "@/components/ui/card";

/* ─── Cost estimates per resource type ─────────────────────────────── */
const ESTIMATES: Record<string, { min: number; max: number }> = {
  compute: { min: 20, max: 200 },
  database: { min: 50, max: 500 },
  storage: { min: 10, max: 100 },
  network: { min: 15, max: 80 },
  serverless: { min: 5, max: 50 },
  security: { min: 10, max: 60 },
  monitoring: { min: 5, max: 30 },
  integration: { min: 10, max: 40 },
};

const categoryLabels: Record<string, string> = {
  compute: "Compute",
  database: "Banco de Dados",
  storage: "Armazenamento",
  network: "Rede",
  serverless: "Serverless",
  security: "Segurança",
  monitoring: "Monitoramento",
  integration: "Integração",
};

const categoryIcons: Record<string, typeof Server> = {
  compute: Cpu,
  database: Database,
  storage: Server,
  network: Globe,
  serverless: Cpu,
};

/* ─── Main Component ───────────────────────────────────────────────── */

export function WhatIfCost() {
  const { nodes } = useCanvasStore();
  const { costSummary } = useCostStore();
  const [tier, setTier] = useState<"min" | "avg" | "max">("avg");

  const analysis = useMemo(() => {
    // Group nodes by category
    const byCategory: Record<string, number> = {};
    for (const node of nodes) {
      const cat = node.data?.category || "compute";
      byCategory[cat] = (byCategory[cat] || 0) + 1;
    }

    // Calculate proposed cost
    const proposedDetails: { category: string; count: number; cost: number }[] =
      [];
    let proposedTotal = 0;

    for (const [cat, count] of Object.entries(byCategory)) {
      const est = ESTIMATES[cat] || ESTIMATES.compute;
      const perUnit =
        tier === "min"
          ? est.min
          : tier === "max"
            ? est.max
            : (est.min + est.max) / 2;
      const cost = Math.round(perUnit * count);
      proposedDetails.push({ category: cat, count, cost });
      proposedTotal += cost;
    }

    const currentTotal = costSummary.totalMonthly;
    const diff = proposedTotal - currentTotal;
    const diffPct =
      currentTotal > 0 ? ((diff / currentTotal) * 100).toFixed(1) : "0";

    return {
      currentTotal,
      proposedTotal,
      diff,
      diffPct,
      proposedDetails: proposedDetails.sort((a, b) => b.cost - a.cost),
      resourceCount: nodes.length,
    };
  }, [nodes, costSummary.totalMonthly, tier]);

  if (nodes.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Adicione recursos ao Design para simular custos
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl p-2 bg-ice-blue">
          <Calculator className="w-4 h-4 text-brand-navy" />
        </div>
        <div>
          <p className="text-sm font-bold text-brand-navy">Simulação What-if</p>
          <p className="text-xs text-slate-400">
            Compare o custo atual com a proposta do canvas atual
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1 rounded-xl bg-slate-100 p-0.5">
          {(["min", "avg", "max"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTier(t)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                tier === t
                  ? "bg-white text-brand-navy shadow-sm"
                  : "text-slate-500 hover:text-brand-navy",
              )}
            >
              {t === "min" ? "Mínimo" : t === "avg" ? "Médio" : "Máximo"}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card
          title="Custo Atual"
          value={`US$ ${analysis.currentTotal.toLocaleString()}/mês`}
          icon={DollarSign}
        />
        <Card
          title="Custo Proposto"
          value={`US$ ${analysis.proposedTotal.toLocaleString()}/mês`}
          icon={TrendingUp}
        />
        <div className="bg-white rounded-3xl card-shadow border border-slate-100 p-5 space-y-2">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "rounded-xl p-2",
                analysis.diff > 0 ? "bg-red-50" : "bg-green-50",
              )}
            >
              {analysis.diff > 0 ? (
                <TrendingUp className="w-4 h-4 text-red-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-green-500" />
              )}
            </div>
            <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">
              Impacto
            </span>
          </div>
          <div
            className={cn(
              "text-3xl font-bold font-display",
              analysis.diff > 0 ? "text-red-600" : "text-green-600",
            )}
          >
            {analysis.diff > 0 ? "+" : ""}
            {analysis.diffPct}%
          </div>
          <p className="text-sm text-slate-500">
            {analysis.diff > 0
              ? `+US$ ${analysis.diff.toLocaleString()}/mês`
              : `-US$ ${Math.abs(analysis.diff).toLocaleString()}/mês`}{" "}
            com {analysis.resourceCount} recurso
            {analysis.resourceCount > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Proposed Cost Breakdown */}
      <div className="bg-white rounded-3xl card-shadow border border-slate-100 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-lime" />
          <h2 className="text-xs font-bold tracking-widest text-slate-400 uppercase">
            Detalhamento Proposto
          </h2>
        </div>
        <div className="space-y-3">
          {analysis.proposedDetails.map((item) => {
            const Icon = categoryIcons[item.category] || Server;
            const pct =
              analysis.proposedTotal > 0
                ? (item.cost / analysis.proposedTotal) * 100
                : 0;
            const est = ESTIMATES[item.category] || ESTIMATES.compute;

            return (
              <div key={item.category} className="flex items-center gap-4">
                <div className="rounded-xl p-2 bg-ice-blue shrink-0">
                  <Icon className="w-4 h-4 text-brand-navy" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-brand-navy">
                      {categoryLabels[item.category] || item.category}
                    </span>
                    <span className="text-xs text-slate-500">
                      {item.count}x · US$ {item.cost.toLocaleString()}/mês
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand-navy/60"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Estimativa: US$ {est.min}–{est.max}/unidade
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
