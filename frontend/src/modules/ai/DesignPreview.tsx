import {
  Plus,
  CheckCircle,
  X,
  BrainCircuit,
  Workflow,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PROVIDER_STYLES, CATEGORY_STYLES } from "./aiops.utils";
import type { Message } from "./aiops.types";
import type { CanvasDesign, ProviderType } from "@/types/canvas.types";

interface DesignPreviewProps {
  msg: Message;
  expandedResources: Set<string>;
  onToggleResource: (msgId: string) => void;
  onOpenInCanvas: (design: CanvasDesign) => void;
}

export function DesignPreview({
  msg,
  expandedResources,
  onToggleResource,
  onOpenInCanvas,
}: DesignPreviewProps) {
  if (!msg.design) return null;

  const resourceCount = msg.design.nodes.length;
  const connectionCount = msg.design.edges.length;
  const isExpanded = expandedResources.has(msg.id);

  return (
    <div className="mt-4 space-y-3 border border-brand-lime/30 rounded-xl bg-gradient-to-br from-brand-lime/[0.04] to-transparent p-4">
      {/* AI Design Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-lime/20 text-brand-navy border border-brand-lime/30">
            <BrainCircuit className="w-3 h-3" />
            Design gerado pela IA
          </span>
          {msg.isModification && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
              <Workflow className="w-3 h-3" />
              Modificação
            </span>
          )}
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          {resourceCount} recursos • {connectionCount} conexões
        </span>
      </div>

      {/* Resources Preview */}
      <button
        onClick={() => onToggleResource(msg.id)}
        className="flex items-center gap-2 w-full text-left text-xs font-bold text-brand-navy bg-white/50 rounded-lg px-3 py-2 border border-slate-200 hover:border-brand-navy/30 transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="w-3.5 h-3.5" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5" />
        )}
        <Layers className="w-3.5 h-3.5" />
        Visualizar recursos
        <span className="ml-auto text-[10px] text-slate-400 font-normal">
          {resourceCount} itens
        </span>
      </button>

      {isExpanded && (
        <div className="grid grid-cols-2 gap-1.5">
          {msg.design.nodes.map((node: any) => {
            const provider = node.data?.provider as ProviderType;
            const pStyle = PROVIDER_STYLES[provider] || PROVIDER_STYLES.aws;
            return (
              <div
                key={node.id}
                className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-100 hover:border-slate-200 transition-colors"
              >
                <div
                  className={cn("w-1.5 h-8 rounded-full shrink-0", pStyle.bg)}
                  style={{
                    backgroundColor:
                      provider === "aws"
                        ? "#FF9900"
                        : provider === "azure"
                          ? "#0078D4"
                          : provider === "gcp"
                            ? "#4285F4"
                            : "#326CE5",
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-brand-navy truncate">
                    {node.data?.label || "Sem nome"}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span
                      className={cn(
                        "text-[9px] px-1 py-0.5 rounded font-medium border",
                        pStyle.color,
                        pStyle.bg,
                        pStyle.border,
                      )}
                    >
                      {pStyle.label}
                    </span>
                    <span className="text-[9px] text-slate-400 truncate">
                      {node.data?.resourceType || ""}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Changes List (for modifications) */}
      {msg.designChanges && msg.designChanges.length > 0 && (
        <div className="space-y-1">
          {msg.designChanges.map((change, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-xs text-slate-700 bg-white/50 p-2 rounded-lg border border-slate-100"
            >
              <div
                className={cn(
                  "w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5",
                  change.action === "add"
                    ? "bg-green-50"
                    : change.action === "modify"
                      ? "bg-blue-50"
                      : "bg-red-50",
                )}
              >
                {change.action === "add" ? (
                  <Plus className="w-3 h-3 text-green-600" />
                ) : change.action === "modify" ? (
                  <CheckCircle className="w-3 h-3 text-blue-600" />
                ) : (
                  <X className="w-3 h-3 text-red-600" />
                )}
              </div>
              <span className="flex-1">{change.description}</span>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => onOpenInCanvas(msg.design!)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-brand-navy text-white text-xs font-bold hover:bg-brand-navy/90 transition-all shadow-sm"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          {msg.isModification
            ? "Aplicar Alterações no Canvas"
            : "Abrir no Canvas"}
        </button>
      </div>
    </div>
  );
}
