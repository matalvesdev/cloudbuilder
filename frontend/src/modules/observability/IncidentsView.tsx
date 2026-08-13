import { useState, useEffect } from "react";
import {
  Bell,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Eye,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSSE } from "@/hooks/useSSE";
import { observabilityApi } from "@/api/observability";
import type { IncidentDTO } from "@/types/observability.types";

const SEVERITY_CONFIG: Record<
  string,
  { bg: string; icon: typeof AlertCircle }
> = {
  critical: { bg: "bg-red-50 border-red-200", icon: AlertCircle },
  warning: { bg: "bg-amber-50 border-amber-200", icon: AlertCircle },
  info: { bg: "bg-blue-50 border-blue-200", icon: AlertCircle },
};

export function IncidentsView() {
  const [activeIncidents, setActiveIncidents] = useState<IncidentDTO[]>([]);
  const [resolvedIncidents, setResolvedIncidents] = useState<IncidentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: streamData } = useSSE<IncidentDTO[]>(
    "/observability/incidents/stream",
    "incidents",
  );

  useEffect(() => {
    loadIncidents();
  }, []);

  useEffect(() => {
    if (streamData) {
      setActiveIncidents(streamData);
    }
  }, [streamData]);

  const loadIncidents = async () => {
    setLoading(true);
    try {
      const active = await observabilityApi.getActiveIncidents();
      setActiveIncidents(active as any[]);
      // Resolved incidents would come from a separate endpoint
      setResolvedIncidents([]);
    } catch {
      setActiveIncidents([]);
      setResolvedIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      await observabilityApi.acknowledgeIncident(id);
      loadIncidents();
    } catch {}
  };

  const handleResolve = async (id: string) => {
    try {
      await observabilityApi.resolveIncident(id);
      loadIncidents();
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-brand-navy" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Bell className="h-5 w-5 text-brand-navy" />
        <h2 className="text-lg font-bold text-brand-navy font-display">
          Incidentes
        </h2>
      </div>

      {activeIncidents.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-red-600 mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            Ativos ({activeIncidents.length})
          </h3>
          <div className="space-y-2">
            {activeIncidents.map((inc) => {
              const config =
                SEVERITY_CONFIG[inc.severity] || SEVERITY_CONFIG.info;
              const Icon = config.icon;
              return (
                <div
                  key={inc.id}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border p-4",
                    config.bg,
                  )}
                >
                  <Icon className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-brand-navy">
                        {inc.title}
                      </p>
                      <Badge
                        variant="outline"
                        className="text-[10px] uppercase"
                      >
                        {inc.severity}
                      </Badge>
                    </div>
                    {inc.description && (
                      <p className="text-xs text-slate-500 mt-1">
                        {inc.description}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(inc.startedAt).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAcknowledge(inc.id)}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      Reconhecer
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600"
                      onClick={() => handleResolve(inc.id)}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Resolver
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-bold text-slate-500 mb-3">
          Histórico ({resolvedIncidents.length})
        </h3>
        {resolvedIncidents.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <XCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhum incidente resolvido</p>
          </div>
        ) : (
          <div className="space-y-2">
            {resolvedIncidents.map((inc) => (
              <div
                key={inc.id}
                className="flex items-start gap-3 rounded-xl border border-slate-100 p-4 bg-white"
              >
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-600">{inc.title}</p>
                  <p className="text-xs text-slate-400">
                    Resolvido em{" "}
                    {inc.resolvedAt
                      ? new Date(inc.resolvedAt).toLocaleString("pt-BR")
                      : "—"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
