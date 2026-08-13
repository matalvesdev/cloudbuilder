import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useCanvasStore } from "@/store/canvasStore";
import { useUiStore } from "@/store/uiStore";
import {
  useIncidentStore,
  type ResourceModification,
} from "@/store/incidentStore";
import {
  CheckCircle,
  XCircle,
  ArrowRight,
  Settings,
  RotateCcw,
  Rocket,
  FileCheck,
  AlertTriangle,
  Server,
  Database,
  Shield,
  Network,
  HardDrive,
  Box,
  Zap,
} from "lucide-react";
import type { ProviderType } from "@/types/canvas.types";

const PROVIDER_COLORS: Record<string, string> = {
  aws: "text-orange-600",
  azure: "text-blue-600",
  gcp: "text-blue-500",
  k8s: "text-indigo-600",
};

function getResourceIcon(resourceType?: string) {
  if (!resourceType) return <Box className="w-4 h-4" />;
  const t = resourceType.toLowerCase();
  if (t.includes("rds") || t.includes("db") || t.includes("dynamodb"))
    return <Database className="w-4 h-4" />;
  if (t.includes("ecs") || t.includes("lambda") || t.includes("ec2"))
    return <Server className="w-4 h-4" />;
  if (t.includes("s3") || t.includes("bucket") || t.includes("volume"))
    return <HardDrive className="w-4 h-4" />;
  if (
    t.includes("sg") ||
    t.includes("security") ||
    t.includes("waf") ||
    t.includes("cognito")
  )
    return <Shield className="w-4 h-4" />;
  if (
    t.includes("vpc") ||
    t.includes("subnet") ||
    t.includes("igw") ||
    t.includes("alb") ||
    t.includes("nlb")
  )
    return <Network className="w-4 h-4" />;
  return <Zap className="w-4 h-4" />;
}

interface IncidentFixDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incidentId: string;
  incidentTitle: string;
  fixDescription: string;
  modifications: ResourceModification[];
}

export function IncidentFixDialog({
  open,
  onOpenChange,
  incidentId,
  incidentTitle,
  fixDescription,
  modifications,
}: IncidentFixDialogProps) {
  const { nodes: currentNodes } = useCanvasStore();
  const { updateNodeProperties, updateNodeLabel } = useCanvasStore();
  const { setActiveModule } = useUiStore();
  const { addFixHistory, markDeployed, markResult } = useIncidentStore();
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const currentDesignNodes = useMemo(() => {
    return modifications.map((mod) => {
      const node = currentNodes.find((n) => n.id === mod.nodeId);
      return {
        id: mod.nodeId,
        label: node?.data?.label || mod.nodeLabel,
        provider: (node?.data?.provider || "aws") as ProviderType,
        resourceType: node?.data?.resourceType || "",
        currentValue: mod.oldValue,
        newValue: mod.newValue,
        property: mod.property,
      };
    });
  }, [modifications, currentNodes]);

  const handleApplyOnly = () => {
    setApplying(true);
    try {
      modifications.forEach((mod) => {
        if (mod.property === "label") {
          updateNodeLabel(mod.nodeId, mod.newValue);
        } else {
          updateNodeProperties(mod.nodeId, { [mod.property]: mod.newValue });
        }
      });
      const fixEntry = addFixHistory({
        incidentId,
        incidentTitle,
        fixDescription,
        modifications,
        deployedAt: null,
        result: "success",
        autoFix: false,
      });
      markResult(fixEntry.id, "success");
      setApplied(true);
    } catch {
      // silent
    } finally {
      setApplying(false);
    }
  };

  const handleApplyAndDeploy = () => {
    handleApplyOnly();
    setActiveModule("provisioning");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-brand-navy">
            <Settings className="w-5 h-5 text-brand-lime" />
            Aplicar Correção Automática
          </DialogTitle>
          <DialogDescription>
            Revise as alterações antes de aplicar a correção para:{" "}
            <strong>{incidentTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Fix Description */}
          <div className="bg-brand-lime/10 border border-brand-lime/30 rounded-lg p-3 flex items-start gap-3">
            <FileCheck className="w-5 h-5 text-brand-navy shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-brand-navy">
                Correção Sugerida
              </p>
              <p className="text-xs text-slate-600 mt-0.5">{fixDescription}</p>
            </div>
          </div>

          {/* Side-by-side comparison */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
              Alterações por Recurso
            </p>
            <ScrollArea className="max-h-72">
              <div className="space-y-2">
                {currentDesignNodes.map((node, i) => (
                  <div
                    key={node.id}
                    className="border border-slate-200 rounded-lg overflow-hidden"
                  >
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border-b border-slate-200">
                      <div
                        className={cn(
                          "w-1.5 h-6 rounded-full shrink-0",
                          PROVIDER_COLORS[node.provider],
                        )}
                        style={{
                          backgroundColor:
                            node.provider === "aws"
                              ? "#FF9900"
                              : node.provider === "azure"
                                ? "#0078D4"
                                : node.provider === "gcp"
                                  ? "#4285F4"
                                  : "#326CE5",
                        }}
                      />
                      {getResourceIcon(node.resourceType)}
                      <span className="text-xs font-bold text-brand-navy">
                        {node.label}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono ml-auto">
                        {node.property}
                      </span>
                    </div>
                    <div className="grid grid-cols-[1fr_auto_1fr] gap-2 p-3 items-center">
                      {/* Current */}
                      <div className="bg-red-50 border border-red-200 rounded-lg p-2.5">
                        <p className="text-[10px] font-bold text-red-600 uppercase mb-0.5">
                          Atual
                        </p>
                        <p className="text-xs font-mono text-red-700 break-all">
                          {typeof node.currentValue === "object"
                            ? JSON.stringify(node.currentValue)
                            : String(node.currentValue ?? "—")}
                        </p>
                      </div>
                      {/* Arrow */}
                      <div className="flex items-center justify-center">
                        <ArrowRight className="w-5 h-5 text-brand-lime" />
                      </div>
                      {/* New */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-2.5">
                        <p className="text-[10px] font-bold text-green-600 uppercase mb-0.5">
                          Corrigido
                        </p>
                        <p className="text-xs font-mono text-green-700 break-all">
                          {typeof node.newValue === "object"
                            ? JSON.stringify(node.newValue)
                            : String(node.newValue)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Status / Warnings */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              Esta correção será aplicada ao design atual no canvas. As
              alterações podem ser desfeitas via undo.
              {modifications.length === 0 &&
                " Nenhuma modificação detectada no canvas atual."}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <DialogClose asChild>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors">
              <XCircle className="w-4 h-4" />
              Cancelar
            </button>
          </DialogClose>
          <div className="flex items-center gap-2">
            {applied ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 text-green-700 text-xs font-bold border border-green-200">
                <CheckCircle className="w-4 h-4" />
                Aplicado ao Canvas
                <DialogClose asChild>
                  <button
                    onClick={() => setActiveModule("provisioning")}
                    className="ml-2 px-2 py-1 rounded-md bg-brand-navy text-white text-[10px] font-bold hover:bg-brand-navy/90"
                  >
                    Ir para Deploy
                  </button>
                </DialogClose>
              </div>
            ) : (
              <>
                <button
                  onClick={handleApplyOnly}
                  disabled={applying}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  {applying ? "Aplicando..." : "Apenas Aplicar"}
                </button>
                <button
                  onClick={handleApplyAndDeploy}
                  disabled={applying}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-navy text-white text-xs font-bold hover:bg-brand-navy/90 transition-all shadow-md disabled:opacity-50"
                >
                  <Rocket className="w-4 h-4" />
                  {applying ? "Aplicando..." : "Aplicar e Deploy"}
                </button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
