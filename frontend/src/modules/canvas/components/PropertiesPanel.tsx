import { useCallback, useMemo } from "react";
import { X, Trash2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { useCanvasStore } from "@/store/canvasStore";
import { DynamicPropertyForm, getSchema } from "./properties";
import { ServiceIcon } from "../nodes/providerIcons";
import type { Node } from "@xyflow/react";
import type { CanvasNodeData } from "@/types/canvas.types";

interface PropertiesPanelProps {
  node: Node | null;
  onClose: () => void;
}

const providerColors: Record<string, string> = {
  aws: "bg-orange-100 text-orange-700",
  azure: "bg-blue-100 text-blue-700",
  gcp: "bg-green-100 text-green-700",
  k8s: "bg-indigo-100 text-indigo-700",
};

export function PropertiesPanel({ node, onClose }: PropertiesPanelProps) {
  const { updateNodeProperties, removeNode } = useCanvasStore();

  const data = node?.data as unknown as CanvasNodeData | undefined;
  const schema = useMemo(() => {
    if (!data?.resourceType) return [];
    return getSchema(data.resourceType);
  }, [data?.resourceType]);

  const handlePropertyChange = useCallback(
    (key: string, value: any) => {
      if (!node) return;
      updateNodeProperties(node.id, { [key]: value });
    },
    [node, updateNodeProperties],
  );

  const handleDelete = useCallback(() => {
    if (!node) return;
    removeNode(node.id);
    onClose();
  }, [node, removeNode, onClose]);

  if (!node || !data) {
    return (
      <div className="bg-white border-l border-slate-100 flex items-center justify-center text-sm text-slate-400 p-4">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-ice-blue flex items-center justify-center mx-auto">
            <span className="text-xl text-brand-navy font-display font-bold">
              ◈
            </span>
          </div>
          <div className="text-xs text-slate-400 max-w-[160px]">
            Selecione um componente para editar suas propriedades
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-l border-slate-100 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2 min-w-0">
          <div className="rounded-lg bg-ice-blue p-1.5">
            <ServiceIcon componentId={data.componentDefinitionId} size={16} />
          </div>
          <div className="text-sm font-semibold text-brand-navy truncate font-display">
            {data.label}
          </div>
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 rounded-md border-slate-200 ${providerColors[data.provider] ?? ""}`}
          >
            {data.provider.toUpperCase()}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-slate-400 hover:text-brand-navy"
          onClick={onClose}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          <div>
            <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">
              Tipo de Recurso
            </span>
            <div className="mt-1.5 font-mono text-xs bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-slate-700">
              {data.resourceType}
            </div>
          </div>

          <Separator className="bg-slate-100" />

          <Collapsible defaultOpen={schema.length > 0}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-lime" />
                <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                  Propriedades
                </span>
              </div>
              <CollapsibleTrigger asChild>
                <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100 transition-colors">
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 data-[state=open]:rotate-180 transition-transform" />
                </button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="mt-3 space-y-3">
              {schema.length > 0 ? (
                <DynamicPropertyForm
                  schema={schema}
                  values={data.properties ?? {}}
                  onChange={handlePropertyChange}
                />
              ) : (
                <div className="text-xs text-slate-400 italic bg-slate-50 rounded-lg px-3 py-4 text-center border border-slate-100">
                  Nenhuma propriedade definida para {data.resourceType}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-slate-100 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 border-slate-200 rounded-lg"
          onClick={handleDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Excluir
        </Button>
      </div>
    </div>
  );
}
