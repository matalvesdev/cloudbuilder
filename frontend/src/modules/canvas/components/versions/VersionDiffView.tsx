import { Plus, Minus, Pencil } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { VersionDiff, DiffEntry } from "../../services/versionApi";

interface VersionDiffViewProps {
  diff: VersionDiff;
}

function DiffChangeRow({
  entry,
  type,
}: {
  entry: DiffEntry;
  type: "added" | "removed" | "modified";
}) {
  const colors = {
    added: "bg-green-50 border-green-100",
    removed: "bg-red-50 border-red-100",
    modified: "bg-yellow-50 border-yellow-100",
  };
  const icons = {
    added: <Plus className="h-3.5 w-3.5 text-green-600" />,
    removed: <Minus className="h-3.5 w-3.5 text-red-600" />,
    modified: <Pencil className="h-3.5 w-3.5 text-yellow-600" />,
  };

  return (
    <div
      className={`flex items-start gap-2 px-3 py-2 border-l-2 rounded-r-lg text-xs ${colors[type]}`}
    >
      <div className="mt-0.5 shrink-0">{icons[type]}</div>
      <div className="min-w-0 flex-1">
        <div className="font-medium text-brand-navy truncate">
          {entry.componentName || entry.componentId}
        </div>
        <div className="text-slate-500 mt-0.5">{entry.details}</div>
      </div>
    </div>
  );
}

function DiffSection({
  title,
  entries,
  type,
}: {
  title: string;
  entries: DiffEntry[];
  type: "added" | "removed" | "modified";
}) {
  if (entries.length === 0) return null;

  const countColors = {
    added: "text-green-700 bg-green-50 border border-green-100",
    removed: "text-red-700 bg-red-50 border border-red-100",
    modified: "text-yellow-700 bg-yellow-50 border border-yellow-100",
  };

  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 px-3 py-1.5">
        <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">
          {title}
        </span>
        <span
          className={`text-[10px] font-medium px-1.5 py-0.5 rounded-lg ${countColors[type]}`}
        >
          {entries.length}
        </span>
      </div>
      <div className="space-y-0.5">
        {entries.map((entry) => (
          <DiffChangeRow key={entry.componentId} entry={entry} type={type} />
        ))}
      </div>
    </div>
  );
}

export function VersionDiffView({ diff }: VersionDiffViewProps) {
  const totalNodesAdded = diff.nodesAdded.length;
  const totalNodesRemoved = diff.nodesRemoved.length;
  const totalNodesModified = diff.nodesModified.length;
  const totalEdgesAdded = diff.edgesAdded.length;
  const totalEdgesRemoved = diff.edgesRemoved.length;

  const hasChanges =
    totalNodesAdded +
      totalNodesRemoved +
      totalNodesModified +
      totalEdgesAdded +
      totalEdgesRemoved >
    0;

  return (
    <ScrollArea className="flex-1">
      <div className="p-3 space-y-2">
        <div className="px-4 py-3 bg-ice-blue/30 rounded-xl border border-slate-100 card-shadow">
          <div className="text-xs font-medium text-brand-navy/70 mb-1.5 font-display">
            Comparando v{diff.versionA} → v{diff.versionB}
          </div>
          <div className="flex flex-wrap gap-2">
            <SummaryBadge
              label="nós adicionados"
              count={totalNodesAdded}
              color="green"
            />
            <SummaryBadge
              label="nós removidos"
              count={totalNodesRemoved}
              color="red"
            />
            <SummaryBadge
              label="nós modificados"
              count={totalNodesModified}
              color="yellow"
            />
            <SummaryBadge
              label="conexões adicionadas"
              count={totalEdgesAdded}
              color="green"
            />
            <SummaryBadge
              label="conexões removidas"
              count={totalEdgesRemoved}
              color="red"
            />
          </div>
        </div>

        {!hasChanges && (
          <div className="p-8 text-center text-sm text-slate-400">
            Nenhuma alteração entre estas versões
          </div>
        )}

        {hasChanges && (
          <div className="space-y-1">
            <DiffSection
              title="Nós Adicionados"
              entries={diff.nodesAdded}
              type="added"
            />
            <DiffSection
              title="Nós Removidos"
              entries={diff.nodesRemoved}
              type="removed"
            />
            <DiffSection
              title="Nós Modificados"
              entries={diff.nodesModified}
              type="modified"
            />
            <DiffSection
              title="Conexões Adicionadas"
              entries={diff.edgesAdded}
              type="added"
            />
            <DiffSection
              title="Conexões Removidas"
              entries={diff.edgesRemoved}
              type="removed"
            />
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

function SummaryBadge({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: "green" | "red" | "yellow";
}) {
  if (count === 0) return null;

  const colorClasses = {
    green: "text-green-700 bg-green-50 border-green-100",
    red: "text-red-700 bg-red-50 border-red-100",
    yellow: "text-yellow-700 bg-yellow-50 border-yellow-100",
  };

  return (
    <div
      className={`text-[10px] font-medium px-2 py-0.5 rounded-lg border ${colorClasses[color]}`}
    >
      {count} {label}
    </div>
  );
}
