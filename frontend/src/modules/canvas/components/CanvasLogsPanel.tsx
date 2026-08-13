import { useState, useEffect, useRef } from "react";
import { Terminal } from "lucide-react";

interface LogEntry {
  timestamp: string;
  level: string;
  source: string;
  message: string;
}

interface CanvasLogsPanelProps {
  environmentId?: string;
}

/**
 * CanvasLogsPanel: Real-time log viewer in the canvas bottom panel.
 * Shows structured logs with filtering and search.
 */
export function CanvasLogsPanel({ environmentId }: CanvasLogsPanelProps) {
  const [logs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // In production, connect to log stream
  }, [environmentId]);

  const filtered = logs.filter((log) => {
    if (levelFilter !== "all" && log.level !== levelFilter) return false;
    if (filter && !log.message.toLowerCase().includes(filter.toLowerCase()))
      return false;
    return true;
  });

  const levelColor = (level: string) => {
    switch (level) {
      case "ERROR":
        return "text-red-500";
      case "WARN":
        return "text-yellow-500";
      case "DEBUG":
        return "text-slate-400";
      default:
        return "text-green-600";
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-slate-200">
        <Terminal className="h-3.5 w-3.5 text-slate-400" />
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filtrar logs..."
          className="flex-1 text-xs px-2 py-1 bg-slate-50 border border-slate-200 rounded"
        />
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="text-xs px-2 py-1 bg-slate-50 border border-slate-200 rounded"
        >
          <option value="all">Todos</option>
          <option value="ERROR">Error</option>
          <option value="WARN">Warn</option>
          <option value="INFO">Info</option>
          <option value="DEBUG">Debug</option>
        </select>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto font-mono text-xs p-2 space-y-0.5"
      >
        {filtered.length === 0 ? (
          <div className="text-slate-400 text-center py-4">
            Nenhum log encontrado
          </div>
        ) : (
          filtered.map((log, i) => (
            <div key={i} className="flex gap-2 hover:bg-slate-50">
              <span className="text-slate-400 shrink-0">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span className={`shrink-0 font-bold ${levelColor(log.level)}`}>
                {log.level}
              </span>
              <span className="text-slate-500 shrink-0">{log.source}</span>
              <span className="text-slate-700">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
