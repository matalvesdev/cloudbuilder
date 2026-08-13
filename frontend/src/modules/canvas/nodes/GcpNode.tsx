import { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import type { CanvasNodeData } from "@/types/canvas.types";
import { ValidationBadge } from "../validation";
import { ServiceIcon } from "./providerIcons";
import CanvasNodeToolbar from "./NodeToolbar";

type CanvasNode = Node<CanvasNodeData>;

function GcpNode(props: NodeProps<CanvasNode>) {
  const { data, selected } = props;
  return (
    <div
      className={`rounded-xl border-2 bg-white card-shadow w-64 ${selected ? "border-[#4285F4] ring-2 ring-brand-lime/40" : "border-slate-100"}`}
    >
      <CanvasNodeToolbar {...props} />
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-[#4285F4]"
      />
      <div className="bg-[#4285F4] text-white px-3 py-2 rounded-t-xl flex items-center gap-2">
        <ServiceIcon componentId={data.componentDefinitionId} size={18} />
        <span className="text-xs font-bold tracking-wider">GCP</span>
        <span className="text-sm font-medium truncate flex-1">
          {data.label}
        </span>
        <ValidationBadge status={data.validationStatus} />
      </div>
      <div className="px-3 py-2 text-xs text-slate-600 bg-white rounded-b-xl">
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-bold">
          {data.resourceType}
        </div>
        {Object.entries(data.properties || {})
          .slice(0, 3)
          .map(([key, val]) => (
            <div key={key} className="flex justify-between mt-1.5">
              <span className="text-slate-400">{key}:</span>
              <span className="font-mono text-slate-700">
                {String(val).slice(0, 20)}
              </span>
            </div>
          ))}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-[#4285F4]"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="w-2 h-2 !bg-slate-400"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="w-2 h-2 !bg-slate-400"
      />
    </div>
  );
}

export default memo(GcpNode);
