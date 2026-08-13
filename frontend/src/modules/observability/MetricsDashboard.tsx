import { useState, useMemo } from "react";
import {
  TrendingUp,
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { Button } from "@/components/ui/button";
import { useSSE } from "@/hooks/useSSE";
import type { MetricQueryResult } from "@/types/observability.types";
import { BRAND_LIME } from "@/components/ui/chart";

type TimeRange = "1h" | "6h" | "24h" | "7d";

const TIME_RANGES: { label: string; value: TimeRange }[] = [
  { label: "1h", value: "1h" },
  { label: "6h", value: "6h" },
  { label: "24h", value: "24h" },
  { label: "7d", value: "7d" },
];

const METRIC_CARDS = [
  {
    title: "CPU",
    icon: Cpu,
    metric: "cloudbuilder.api.metrics.duration",
    suffix: "%",
  },
  {
    title: "Memória",
    icon: HardDrive,
    metric: "cloudbuilder.api.metrics.count",
    suffix: "%",
  },
  {
    title: "Rede",
    icon: Wifi,
    metric: "cloudbuilder.api.traces.count",
    suffix: " req/s",
  },
  {
    title: "Latência",
    icon: Activity,
    metric: "cloudbuilder.api.metrics.duration",
    suffix: "ms",
  },
];

export function MetricsDashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>("1h");
  const { data, connected } = useSSE<MetricQueryResult[]>(
    "/observability/metrics/stream",
    "metrics",
  );

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.map((d) => ({
      timestamp: new Date(d.timestamp).toLocaleTimeString("pt-BR"),
      value: d.value,
    }));
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-brand-navy" />
          <h2 className="text-lg font-bold text-brand-navy font-display">
            Métricas em Tempo Real
          </h2>
          {connected && (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              conectado
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {TIME_RANGES.map(({ label, value }) => (
            <Button
              key={value}
              variant={timeRange === value ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(value)}
              className={timeRange === value ? "bg-brand-navy text-white" : ""}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {METRIC_CARDS.map(({ title, icon: Icon, suffix }) => (
          <div
            key={title}
            className="p-4 bg-white rounded-3xl card-shadow border border-slate-100"
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon className="h-4 w-4 text-brand-navy" />
              <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                {title}
              </span>
            </div>
            <p className="text-2xl font-bold text-brand-navy font-display">
              {chartData.length > 0
                ? `${chartData[chartData.length - 1].value.toFixed(1)}${suffix}`
                : "—"}
            </p>
            <div className="h-12 mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.slice(-20)}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={BRAND_LIME}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl card-shadow border border-slate-100 p-6">
        <h3 className="text-sm font-bold text-brand-navy font-display mb-4">
          Tendência
        </h3>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-brand-navy" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="timestamp"
                tick={{ fontSize: 11 }}
                stroke="#94a3b8"
              />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke={BRAND_LIME}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
