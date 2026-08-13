import { useEffect, useMemo } from "react";
import {
  TrendingUp,
  AlertTriangle,
  Loader2,
  RefreshCw,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCostStore } from "@/store/costStore";
import { Skeleton } from "@/components/ui/skeleton";
import type { CostProjectionPoint } from "@/types/cost.types";

function formatCurrency(value: number): string {
  return `US$ ${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
}

const CHART_MARGIN = { top: 20, right: 20, bottom: 40, left: 70 };
const CHART_WIDTH = 800;
const CHART_HEIGHT = 360;

interface ChartProps {
  data: CostProjectionPoint[];
}

function ProjectionSVG({ data }: ChartProps) {
  const innerW = CHART_WIDTH - CHART_MARGIN.left - CHART_MARGIN.right;
  const innerH = CHART_HEIGHT - CHART_MARGIN.top - CHART_MARGIN.bottom;

  const { minVal, maxVal, xScale, yScale, linePath, areaPath } = useMemo(() => {
    if (data.length === 0) {
      return {
        minVal: 0,
        maxVal: 0,
        xScale: () => 0,
        yScale: () => 0,
        linePath: "",
        areaPath: "",
      };
    }

    const allValues = data.flatMap((d) => [
      d.projectedAmount,
      d.lowerBound,
      d.upperBound,
    ]);
    let min = Math.min(...allValues);
    let max = Math.max(...allValues);

    // Add padding to Y axis
    const padding = (max - min) * 0.15 || max * 0.15 || 50;
    min = Math.max(0, min - padding);
    max = max + padding;

    const xStep = innerW / (data.length - 1);

    const xS = (i: number) => CHART_MARGIN.left + i * xStep;
    const yS = (v: number) =>
      CHART_MARGIN.top + innerH - ((v - min) / (max - min)) * innerH;

    // Line path for projected amount
    const line = data
      .map((d, i) => `${i === 0 ? "M" : "L"}${xS(i)},${yS(d.projectedAmount)}`)
      .join(" ");
    // Area path for confidence interval (lower + upper)
    const upperPoints = data
      .map((d, i) => `${xS(i)},${yS(d.upperBound)}`)
      .join(" L");
    const lowerPoints = data
      .map((d, i) => `${xS(i)},${yS(d.lowerBound)}`)
      .join(" L");
    const area = `M${data.map((d, i) => `${xS(i)},${yS(d.upperBound)}`).join(" L")} L${data.map((d, i) => `${xS(data.length - 1 - i)},${yS(data[data.length - 1 - i].lowerBound)}`).join(" L")} Z`;

    return {
      minVal: min,
      maxVal: max,
      xScale: xS,
      yScale: yS,
      linePath: line,
      areaPath: area,
    };
  }, [data, innerW, innerH]);

  // Y-axis ticks
  const yTicks = useMemo(() => {
    const ticks: { value: number; y: number }[] = [];
    const step = (maxVal - minVal) / 4;
    for (let i = 0; i <= 4; i++) {
      const val = minVal + step * i;
      ticks.push({ value: val, y: yScale(val) });
    }
    return ticks;
  }, [minVal, maxVal, yScale]);

  // X-axis ticks (show ~6 labels)
  const xTicks = useMemo(() => {
    if (data.length === 0) return [];
    const step = Math.max(1, Math.floor(data.length / 6));
    const ticks: { label: string; x: number; idx: number }[] = [];
    for (let i = 0; i < data.length; i += step) {
      ticks.push({
        label: formatShortDate(data[i].date),
        x: xScale(i),
        idx: i,
      });
    }
    // Always include last
    const last = data.length - 1;
    if (ticks.length === 0 || ticks[ticks.length - 1].idx !== last) {
      ticks.push({
        label: formatShortDate(data[last].date),
        x: xScale(last),
        idx: last,
      });
    }
    return ticks;
  }, [data, xScale]);

  const latestProjection =
    data.length > 0 ? data[data.length - 1].projectedAmount : 0;
  const earliestProjection = data.length > 0 ? data[0].projectedAmount : 0;
  const trendPct =
    earliestProjection > 0
      ? (
          ((latestProjection - earliestProjection) / earliestProjection) *
          100
        ).toFixed(1)
      : "0.0";
  const isUp = parseFloat(trendPct) >= 0;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl card-shadow border border-slate-100 p-4 text-center space-y-1">
          <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
            Projeção Atual
          </p>
          <p className="text-xl font-bold text-brand-navy">
            {formatCurrency(latestProjection)}
          </p>
        </div>
        <div className="bg-white rounded-3xl card-shadow border border-slate-100 p-4 text-center space-y-1">
          <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
            Início
          </p>
          <p className="text-xl font-bold text-brand-navy">
            {formatCurrency(earliestProjection)}
          </p>
        </div>
        <div className="bg-white rounded-3xl card-shadow border border-slate-100 p-4 text-center space-y-1">
          <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
            Tendência
          </p>
          <div
            className={cn(
              "text-xl font-bold flex items-center justify-center gap-1",
              isUp ? "text-red-600" : "text-green-600",
            )}
          >
            {isUp ? "+" : ""}
            {trendPct}%
            {isUp ? (
              <TrendingUp className="w-5 h-5" />
            ) : (
              <TrendingUp className="w-5 h-5 rotate-180" />
            )}
          </div>
        </div>
        <div className="bg-white rounded-3xl card-shadow border border-slate-100 p-4 text-center space-y-1">
          <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
            Período
          </p>
          <p className="text-xl font-bold text-brand-navy text-sm leading-tight">
            {data.length > 0 ? (
              <>
                {formatShortDate(data[0].date)}
                <span className="text-slate-400 mx-1">—</span>
                {formatShortDate(data[data.length - 1].date)}
              </>
            ) : (
              "—"
            )}
          </p>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="bg-white rounded-3xl card-shadow border border-slate-100 p-6">
        <div className="flex items-center gap-2 mb-6">
          <span className="w-2 h-2 rounded-full bg-brand-lime" />
          <h2 className="text-xs font-bold tracking-widest text-slate-400 uppercase">
            Projeção de Custos
          </h2>
        </div>
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="w-full h-auto"
          style={{ maxHeight: "400px" }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Grid lines */}
          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={CHART_MARGIN.left}
                y1={tick.y}
                x2={CHART_WIDTH - CHART_MARGIN.right}
                y2={tick.y}
                stroke="#e2e8f0"
                strokeWidth={1}
                strokeDasharray={i === 0 ? "none" : "4,4"}
              />
              <text
                x={CHART_MARGIN.left - 8}
                y={tick.y}
                textAnchor="end"
                dominantBaseline="middle"
                className="text-xs fill-slate-400"
                fontSize="11"
              >
                {formatCurrency(tick.value)}
              </text>
            </g>
          ))}

          {/* Confidence interval area */}
          {areaPath && (
            <path d={areaPath} fill="url(#gradient)" opacity={0.3} />
          )}

          {/* Upper bound line (dashed) */}
          {data.length > 0 && (
            <path
              d={data
                .map(
                  (d, i) =>
                    `${i === 0 ? "M" : "L"}${xScale(i)},${yScale(d.upperBound)}`,
                )
                .join(" ")}
              fill="none"
              stroke="#0a1128"
              strokeWidth={1}
              strokeDasharray="6,3"
              opacity={0.3}
            />
          )}

          {/* Lower bound line (dashed) */}
          {data.length > 0 && (
            <path
              d={data
                .map(
                  (d, i) =>
                    `${i === 0 ? "M" : "L"}${xScale(i)},${yScale(d.lowerBound)}`,
                )
                .join(" ")}
              fill="none"
              stroke="#0a1128"
              strokeWidth={1}
              strokeDasharray="6,3"
              opacity={0.3}
            />
          )}

          {/* Main projection line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#0a1128"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data points */}
          {data.map((d, i) => (
            <circle
              key={i}
              cx={xScale(i)}
              cy={yScale(d.projectedAmount)}
              r={3}
              fill="#0a1128"
              className="hover:r-5 transition-all"
            >
              <title>{`${formatShortDate(d.date)}: ${formatCurrency(d.projectedAmount)} (IC: ${formatCurrency(d.lowerBound)}-${formatCurrency(d.upperBound)})`}</title>
            </circle>
          ))}

          {/* X-axis labels */}
          {xTicks.map((tick, i) => (
            <text
              key={i}
              x={tick.x}
              y={CHART_HEIGHT - 8}
              textAnchor="middle"
              className="text-xs fill-slate-400"
              fontSize="11"
            >
              {tick.label}
            </text>
          ))}

          {/* Gradient definition */}
          <defs>
            <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0a1128" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#0a1128" stopOpacity={0.02} />
            </linearGradient>
          </defs>
        </svg>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-brand-navy rounded-full" />
            <span className="text-xs text-slate-500">Projeção</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-0.5 bg-brand-navy/30 rounded-full"
              style={{ borderTop: "2px dashed rgba(10,17,40,0.3)" }}
            />
            <span className="text-xs text-slate-500">
              Intervalo de Confiança
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-brand-navy/15 rounded" />
            <span className="text-xs text-slate-500">Margem de Variação</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CostProjectionChart() {
  const { projection, projectionLoading, projectionError, fetchProjection } =
    useCostStore();

  const envId =
    localStorage.getItem("cloudbuilder-active-environment") || "default";

  useEffect(() => {
    fetchProjection(envId, 30);
  }, [envId, fetchProjection]);

  function handleRefresh() {
    fetchProjection(envId, 30);
  }

  if (projectionLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-brand-navy font-display">
              Projeção de Custos
            </h2>
            <p className="text-sm text-slate-400">
              Estimativa de gastos para os próximos 30 dias
            </p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-3xl border border-slate-100 card-shadow p-4 text-center space-y-2"
            >
              <Skeleton className="h-3 w-16 mx-auto" />
              <Skeleton className="h-6 w-24 mx-auto" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-3xl card-shadow border border-slate-100 p-6">
          <Skeleton className="h-4 w-32 mb-6" />
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (projectionError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-brand-navy font-display">
              Projeção de Custos
            </h2>
            <p className="text-sm text-slate-400">
              Estimativa de gastos para os próximos 30 dias
            </p>
          </div>
        </div>
        <div className="rounded-2xl bg-red-50 border border-red-200 p-6 text-center">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-red-400" />
          <p className="text-sm font-medium text-red-700 mb-1">
            Erro ao carregar projeção
          </p>
          <p className="text-xs text-red-500 mb-4">{projectionError}</p>
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
            Projeção de Custos
          </h2>
          <p className="text-sm text-slate-400">
            Estimativa de gastos para os próximos 30 dias
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

      {projection.length === 0 ? (
        <div className="rounded-2xl bg-slate-50 border border-slate-100 p-12 text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-medium text-slate-500">
            Nenhum dado de projeção disponível
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Os dados de projeção aparecerão aqui após alguns dias de coleta
          </p>
        </div>
      ) : (
        <ProjectionSVG data={projection} />
      )}
    </div>
  );
}
