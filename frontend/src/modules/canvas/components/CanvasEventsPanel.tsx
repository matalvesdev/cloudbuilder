import { useState, useEffect } from "react";
import { Radio } from "lucide-react";

interface EventEntry {
  id: string;
  type: string;
  timestamp: string;
  source: string;
  data: Record<string, unknown>;
}

interface CanvasEventsPanelProps {
  canvasId?: string;
}

/**
 * CanvasEventsPanel: Event stream viewer in the canvas bottom panel.
 * Shows domain events emitted by the canvas and connected services.
 */
export function CanvasEventsPanel({ canvasId }: CanvasEventsPanelProps) {
  const [events] = useState<EventEntry[]>([]);
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    // In production, subscribe to SSE/WebSocket event stream
  }, [canvasId]);

  const eventTypes = [...new Set(events.map((e) => e.type))];
  const filtered =
    typeFilter === "all" ? events : events.filter((e) => e.type === typeFilter);

  const typeColor = (type: string) => {
    if (type.includes("error") || type.includes("failed"))
      return "bg-red-100 text-red-700";
    if (type.includes("warning")) return "bg-yellow-100 text-yellow-700";
    if (type.includes("deploy")) return "bg-blue-100 text-blue-700";
    return "bg-slate-100 text-slate-700";
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-slate-200">
        <Radio className="h-3.5 w-3.5 text-slate-400" />
        <span className="text-xs font-medium text-slate-500">Eventos</span>
        <div className="flex-1" />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="text-xs px-2 py-1 bg-slate-50 border border-slate-200 rounded"
        >
          <option value="all">Todos os tipos</option>
          {eventTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filtered.length === 0 ? (
          <div className="text-slate-400 text-xs text-center py-4">
            Nenhum evento registrado
          </div>
        ) : (
          filtered.map((event) => (
            <div
              key={event.id}
              className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50"
            >
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${typeColor(event.type)}`}
              >
                {event.type}
              </span>
              <span className="text-[10px] text-slate-400 shrink-0">
                {new Date(event.timestamp).toLocaleTimeString()}
              </span>
              <span className="text-[10px] text-slate-500">{event.source}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
