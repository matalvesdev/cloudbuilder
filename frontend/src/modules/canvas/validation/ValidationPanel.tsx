import { useCallback } from "react";
import { AlertTriangle, X, Info, CheckCircle, Minus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { ValidationIssue } from "./validationService";

interface ValidationPanelProps {
  issues: ValidationIssue[];
  errorCount: number;
  warningCount: number;
  infoCount: number;
  overallStatus: "VALID" | "WARNINGS" | "INVALID" | "PENDING";
  onSelectIssue?: (componentId?: string) => void;
}

const severityIcon = {
  ERROR: X,
  WARNING: AlertTriangle,
  INFO: Info,
};

const severityColor: Record<string, string> = {
  ERROR: "text-red-700 bg-red-50 border-red-100",
  WARNING: "text-yellow-700 bg-yellow-50 border-yellow-100",
  INFO: "text-blue-700 bg-blue-50 border-blue-100",
};

export function ValidationPanel({
  issues,
  errorCount,
  warningCount,
  infoCount,
  overallStatus,
  onSelectIssue,
}: ValidationPanelProps) {
  const grouped = {
    ERROR: issues.filter((i) => i.severity === "ERROR"),
    WARNING: issues.filter((i) => i.severity === "WARNING"),
    INFO: issues.filter((i) => i.severity === "INFO"),
  };

  const handleClick = useCallback(
    (componentId?: string) => {
      onSelectIssue?.(componentId);
    },
    [onSelectIssue],
  );

  if (issues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        {overallStatus === "PENDING" ? (
          <Minus className="w-10 h-10 text-slate-300 mb-3" />
        ) : (
          <CheckCircle className="w-10 h-10 text-green-500 mb-3" />
        )}
        <p className="text-sm font-medium text-brand-navy">
          {overallStatus === "PENDING" ? "Nenhum resultado" : "Tudo ok"}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          {overallStatus === "PENDING"
            ? "Execute a validação para verificar seu design"
            : "Seu design está válido"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-100">
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-lime" />
            <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">
              Validação
            </span>
          </div>
          {overallStatus === "INVALID" && (
            <Badge
              variant="destructive"
              className="text-[10px] px-1.5 py-0 rounded-md"
            >
              {errorCount} erro(s)
            </Badge>
          )}
          {overallStatus === "WARNINGS" && (
            <Badge
              variant="secondary"
              className="text-[10px] px-1.5 py-0 rounded-md"
            >
              {warningCount} aviso(s)
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          {errorCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-50 border border-red-100 text-red-700 text-[10px] font-bold">
              <X className="w-3 h-3" /> {errorCount} erro(s)
            </span>
          )}
          {warningCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-yellow-50 border border-yellow-100 text-yellow-700 text-[10px] font-bold">
              <AlertTriangle className="w-3 h-3" /> {warningCount} aviso(s)
            </span>
          )}
          {infoCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-bold">
              <Info className="w-3 h-3" /> {infoCount} info(s)
            </span>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-2 py-2 space-y-3">
          {(
            Object.entries(grouped) as [
              keyof typeof grouped,
              ValidationIssue[],
            ][]
          ).map(
            ([severity, items]) =>
              items.length > 0 && (
                <div key={severity}>
                  <h4 className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-2 mb-1">
                    {severity === "ERROR" && "Erros"}
                    {severity === "WARNING" && "Avisos"}
                    {severity === "INFO" && "Informações"}
                  </h4>
                  <div className="space-y-1">
                    {items.map((issue, idx) => {
                      const Icon = severityIcon[issue.severity];
                      return (
                        <button
                          key={`${issue.componentId ?? "global"}-${idx}`}
                          onClick={() => handleClick(issue.componentId)}
                          className={`w-full text-left p-2 rounded-lg border text-xs transition-colors ${severityColor[issue.severity]} hover:opacity-80`}
                        >
                          <div className="flex items-start gap-2">
                            <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            <div className="min-w-0">
                              <div className="font-medium">
                                {issue.ruleName}
                              </div>
                              <p className="text-[11px] opacity-80 mt-0.5">
                                {issue.message}
                              </p>
                              {issue.componentId && (
                                <span className="text-[10px] opacity-60 mt-0.5 block">
                                  Clique para localizar o nó
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <Separator className="my-2 bg-slate-100" />
                </div>
              ),
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
