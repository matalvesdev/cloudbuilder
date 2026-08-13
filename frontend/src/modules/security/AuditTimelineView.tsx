import { useEffect, useState, useCallback } from "react";
import {
  Clock,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  User,
  Globe,
  FileText,
  Loader2,
  AlertCircle,
  FilterX,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { auditApi } from "@/api/audit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuditStore } from "@/store/auditStore";
import type { AuditQueryParams } from "@/types/audit.types";

// ─── Action color mapping ─────────────────────────────────────

const ACTION_COLORS: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  CREATE: { bg: "bg-green-50", text: "text-green-700", label: "Criado" },
  UPDATE: { bg: "bg-blue-50", text: "text-blue-700", label: "Atualizado" },
  DELETE: { bg: "bg-red-50", text: "text-red-700", label: "Excluído" },
  LOGIN: { bg: "bg-purple-50", text: "text-purple-700", label: "Login" },
};

function getActionStyle(action: string) {
  return (
    ACTION_COLORS[action.toUpperCase()] || {
      bg: "bg-slate-50",
      text: "text-slate-600",
      label: action,
    }
  );
}

const ACTION_OPTIONS = ["CREATE", "UPDATE", "DELETE", "LOGIN"];

// ─── Date input helper ────────────────────────────────────────

function DateInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
        {label}
      </label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none transition-colors focus:border-brand-navy focus:ring-1 focus:ring-brand-navy/20"
      />
    </div>
  );
}

// ─── Format timestamp ─────────────────────────────────────────

function formatTimestamp(ts: string): { date: string; time: string } {
  const d = new Date(ts);
  const date = d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return { date, time };
}

// ─── Export button ────────────────────────────────────────────

function ExportButton({
  format,
  params,
}: {
  format: "csv" | "json";
  params: AuditQueryParams;
}) {
  const [loading, setLoading] = useState(false);
  const tenantId =
    localStorage.getItem("cloudbuilder-active-tenant-id") || "default";

  const handleExport = useCallback(async () => {
    setLoading(true);
    try {
      if (format === "csv") {
        const blob = await auditApi.exportCsv(tenantId, params);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `auditoria-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        const data = await auditApi.exportJson(tenantId, params);
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `auditoria-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [format, tenantId, params]);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={loading}
      className="gap-1.5"
    >
      <Download className="h-3.5 w-3.5" />
      {loading ? "Exportando…" : `Exportar ${format.toUpperCase()}`}
    </Button>
  );
}

// ─── Main View ─────────────────────────────────────────────────

export function AuditTimelineView() {
  const {
    events,
    loadingEvents,
    eventsError,
    currentPage,
    fetchEvents,
    setPage,
  } = useAuditStore();

  // Filters
  const [filterUserId, setFilterUserId] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterResourceType, setFilterResourceType] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const buildParams = useCallback(
    (): AuditQueryParams => ({
      userId: filterUserId || undefined,
      action: filterAction || undefined,
      resourceType: filterResourceType || undefined,
      startDate: filterStartDate || undefined,
      endDate: filterEndDate || undefined,
    }),
    [
      filterUserId,
      filterAction,
      filterResourceType,
      filterStartDate,
      filterEndDate,
    ],
  );

  // Initial load
  useEffect(() => {
    fetchEvents(undefined, buildParams());
  }, [currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = useCallback(() => {
    setPage(0);
    fetchEvents(undefined, { ...buildParams(), page: 0 });
  }, [fetchEvents, setPage, buildParams]);

  const handleClearFilters = useCallback(() => {
    setFilterUserId("");
    setFilterAction("");
    setFilterResourceType("");
    setFilterStartDate("");
    setFilterEndDate("");
    setPage(0);
    fetchEvents(undefined, { page: 0 });
  }, [fetchEvents, setPage]);

  const handlePrevPage = useCallback(() => {
    if (currentPage > 0) setPage(currentPage - 1);
  }, [currentPage, setPage]);

  const handleNextPage = useCallback(() => {
    setPage(currentPage + 1);
  }, [currentPage, setPage]);

  const hasActiveFilters =
    filterUserId ||
    filterAction ||
    filterResourceType ||
    filterStartDate ||
    filterEndDate;
  const params = buildParams();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-brand-navy font-display">
            Timeline de Auditoria
          </h2>
          <p className="text-sm text-slate-400">
            Eventos registrados em ordem cronológica
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton format="csv" params={params} />
          <ExportButton format="json" params={params} />
        </div>
      </div>

      {/* Filter toggler */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "gap-1.5",
            showFilters && "border-brand-navy bg-brand-navy/5",
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filtros
          {hasActiveFilters && (
            <span className="ml-1 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold rounded-full bg-brand-lime text-brand-navy">
              !
            </span>
          )}
        </Button>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="gap-1.5 text-slate-400"
          >
            <FilterX className="h-3.5 w-3.5" />
            Limpar
          </Button>
        )}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white rounded-2xl card-shadow border border-slate-100 p-5 space-y-4">
          <div className="grid grid-cols-5 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                Usuário
              </label>
              <Input
                placeholder="ID do usuário…"
                value={filterUserId}
                onChange={(e) => setFilterUserId(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                Ação
              </label>
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {ACTION_OPTIONS.map((act) => (
                    <SelectItem key={act} value={act}>
                      {act}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                Tipo de Recurso
              </label>
              <Input
                placeholder="Ex: aws_vpc…"
                value={filterResourceType}
                onChange={(e) => setFilterResourceType(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <DateInput
              label="Data Início"
              value={filterStartDate}
              onChange={setFilterStartDate}
            />
            <DateInput
              label="Data Fim"
              value={filterEndDate}
              onChange={setFilterEndDate}
            />
          </div>
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleSearch}
              className="gap-1.5 bg-brand-navy text-white hover:bg-brand-navy/90"
            >
              <Search className="h-3.5 w-3.5" />
              Aplicar Filtros
            </Button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loadingEvents && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-brand-navy" />
        </div>
      )}

      {/* Error */}
      {eventsError && !loadingEvents && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
          <p className="text-sm font-medium text-red-600">{eventsError}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => fetchEvents(undefined, buildParams())}
          >
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Empty state */}
      {!loadingEvents && !eventsError && events.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-ice-blue flex items-center justify-center mb-4">
            <Clock className="w-7 h-7 text-brand-navy" />
          </div>
          <p className="text-base font-semibold text-brand-navy">
            Nenhum evento de auditoria encontrado
          </p>
          <p className="text-sm text-slate-400 mt-1">
            {hasActiveFilters
              ? "Tente ajustar os filtros para ampliar a busca."
              : "Nenhuma ação foi registrada até o momento."}
          </p>
        </div>
      )}

      {/* Timeline */}
      {!loadingEvents && !eventsError && events.length > 0 && (
        <div className="bg-white rounded-3xl card-shadow border border-slate-100 overflow-hidden">
          <div className="relative">
            {events.map((evt, idx) => {
              const { date, time } = formatTimestamp(evt.timestamp);
              const actionStyle = getActionStyle(evt.action);
              const isLast = idx === events.length - 1;

              return (
                <div
                  key={evt.id}
                  className="flex gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors"
                >
                  {/* Timeline line + dot */}
                  <div className="flex flex-col items-center shrink-0 pt-1">
                    <div
                      className={cn(
                        "w-2.5 h-2.5 rounded-full ring-2 ring-white",
                        actionStyle.text
                          .replace("text-", "bg-")
                          .replace("-700", "-500"),
                      )}
                    />
                    {!isLast && (
                      <div className="w-px flex-1 bg-slate-200 mt-1" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[11px] font-semibold",
                          actionStyle.bg,
                          actionStyle.text,
                        )}
                      >
                        {actionStyle.label}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {time}
                      </span>
                      <span className="text-xs text-slate-300">·</span>
                      <span className="text-xs text-slate-400">{date}</span>
                    </div>

                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium text-brand-navy">
                          {evt.userId}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                            {evt.resourceType}
                          </span>
                          <span className="mx-1 text-slate-300">/</span>
                          <span className="font-mono text-xs">
                            {evt.resourceId}
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Globe className="w-3.5 h-3.5 shrink-0" />
                        <span>{evt.ipAddress}</span>
                      </div>
                      {evt.details && (
                        <p className="text-sm text-slate-500 mt-1 pl-6 border-l-2 border-slate-200 italic">
                          {evt.details}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
            <p className="text-xs text-slate-400">
              Página{" "}
              <span className="font-medium text-slate-600">
                {currentPage + 1}
              </span>
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={currentPage === 0}
                className="gap-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                className="gap-1"
              >
                Próximo
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
