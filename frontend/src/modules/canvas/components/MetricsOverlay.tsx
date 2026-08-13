import { useState } from "react";
import {
  Activity,
  Cpu,
  MemoryStick,
  Network,
  HardDrive,
  X,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { useMetricsStream } from "@/hooks/useMetricsStream";
import { useCanvasStore } from "@/store/canvasStore";
import { cn } from "@/lib/utils";
import type { ResourceMetrics } from "@/api/types";

interface Props {
  enabled: boolean;
  onToggle: () => void;
}

const statusConfig = {
  healthy: {
    icon: CheckCircle,
    color: "text-green-500",
    bg: "bg-green-50",
    border: "border-green-200",
    label: "Saudável",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-amber-500",
    bg: "bg-amber-50",
    border: "border-amber-200",
    label: "Alerta",
  },
  critical: {
    icon: AlertCircle,
    color: "text-red-500",
    bg: "bg-red-50",
    border: "border-red-200",
    label: "Crítico",
  },
  unknown: {
    icon: Loader2,
    color: "text-slate-400",
    bg: "bg-slate-50",
    border: "border-slate-200",
    label: "Desconhecido",
  },
};

const providerColors: Record<string, string> = {
  aws: "text-orange-500",
  azure: "text-blue-500",
  gcp: "text-green-500",
  k8s: "text-blue-400",
};

export function MetricsOverlay({ enabled, onToggle }: Props) {
  const [showPanel, setShowPanel] = useState(false);
  const nodes = useCanvasStore((s) => s.nodes);
  const selectedNodeId = useCanvasStore((s) => s.selectedNode);

  // Build node map for the SSE stream
  const nodeNames: Record<string, string> = {};
  const nodeIds = nodes.map((n) => {
    nodeNames[n.id] = n.data?.displayName || n.data?.resourceType || n.id;
    return n.id;
  });

  const { metricsMap, connected, lastUpdate } = useMetricsStream({
    enabled,
    nodeIds,
    nodeNames,
  });

  const now = Date.now();

  // Helper: get latest value from metric points
  const latest = (points?: { timestamp: number; value: number }[]) => {
    if (!points || points.length === 0) return null;
    return points[points.length - 1].value;
  };

  // Helper: format bytes to human-readable
  const fmtBytes = (val: number | null) => {
    if (val === null) return "—";
    if (val < 1024) return `${val.toFixed(0)} B`;
    if (val < 1024 * 1024) return `${(val / 1024).toFixed(1)} KB`;
    return `${(val / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Helper: format percentage
  const fmtPct = (val: number | null) => {
    if (val === null) return "—";
    return `${val.toFixed(1)}%`;
  };

  if (!enabled) return null;

  // ── Selected node detail panel ──
  const selectedMetrics = selectedNodeId ? metricsMap[selectedNodeId] : null;

  return (
    <>
      {/* Node badges are rendered via CanvasView custom node renderer */}
      {/* Floating panel for selected node */}
      {selectedMetrics && (
        <div className="absolute bottom-4 right-4 z-30 w-[300px] bg-white border border-slate-200 rounded-2xl shadow-modal overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-navy" />
              <span className="text-sm font-bold text-brand-navy">
                Métricas
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  connected ? "bg-green-400" : "bg-red-400",
                )}
              />
              <span className="text-[10px] text-slate-400">
                {connected ? "Conectado" : "Desconectado"}
              </span>
              <button
                onClick={onToggle}
                className="text-slate-300 hover:text-brand-navy ml-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Resource info */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-brand-navy">
                {selectedMetrics.resourceName}
              </span>
              <span
                className={cn(
                  "px-1.5 py-0.5 text-[10px] font-bold rounded-full",
                  statusConfig[selectedMetrics.status]?.bg,
                  statusConfig[selectedMetrics.status]?.color,
                  statusConfig[selectedMetrics.status]?.border,
                  "border",
                )}
              >
                {statusConfig[selectedMetrics.status]?.label}
              </span>
            </div>
          </div>

          {/* Metrics grid */}
          <div className="p-4 space-y-3">
            {/* CPU */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-500">CPU</span>
              </div>
              <span className="text-xs font-bold text-brand-navy">
                {fmtPct(latest(selectedMetrics.cpuUtilization))}
              </span>
            </div>

            {/* Memory */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MemoryStick className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-500">Memória</span>
              </div>
              <span className="text-xs font-bold text-brand-navy">
                {fmtPct(latest(selectedMetrics.memoryUtilization))}
              </span>
            </div>

            {/* Network In */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Network className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-500">Rede (in)</span>
              </div>
              <span className="text-xs font-bold text-brand-navy">
                {fmtBytes(latest(selectedMetrics.networkIn))}
              </span>
            </div>

            {/* Network Out */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Network className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-500">Rede (out)</span>
              </div>
              <span className="text-xs font-bold text-brand-navy">
                {fmtBytes(latest(selectedMetrics.networkOut))}
              </span>
            </div>

            {/* Disk Read */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-500">Disco (leitura)</span>
              </div>
              <span className="text-xs font-bold text-brand-navy">
                {fmtBytes(latest(selectedMetrics.diskReadOps))}
              </span>
            </div>

            {/* Disk Write */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-500">Disco (escrita)</span>
              </div>
              <span className="text-xs font-bold text-brand-navy">
                {fmtBytes(latest(selectedMetrics.diskWriteOps))}
              </span>
            </div>
          </div>

          {/* Last updated */}
          <div className="px-4 py-2 border-t border-slate-100 text-[10px] text-slate-400 text-right">
            {lastUpdate
              ? `Atualizado ${new Date(lastUpdate).toLocaleTimeString("pt-BR")}`
              : "Aguardando..."}
          </div>
        </div>
      )}
    </>
  );
}
