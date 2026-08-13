import { useState, useEffect, useCallback } from "react";
import {
  History,
  Plus,
  RotateCcw,
  ArrowLeftRight,
  X,
  Clock,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useCanvasStore } from "@/store/canvasStore";
import { useUiStore } from "@/store/uiStore";
import {
  fetchVersions,
  createVersion,
  rollbackToVersion,
} from "../../services/versionApi";
import { VersionDiffView } from "./VersionDiffView";
import type { CanvasVersion, VersionDiff } from "../../services/versionApi";

export function VersionHistoryPanel() {
  const canvasId = useCanvasStore((s) => s.canvasId);
  const showVersionPanel = useUiStore((s) => s.showVersionPanel);
  const toggleVersionPanel = useUiStore((s) => s.toggleVersionPanel);

  const [versions, setVersions] = useState<CanvasVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<CanvasVersion | null>(
    null,
  );
  const [compareMode, setCompareMode] = useState(false);
  const [versionA, setVersionA] = useState<number | null>(null);
  const [versionB, setVersionB] = useState<number | null>(null);
  const [diff, setDiff] = useState<VersionDiff | null>(null);
  const [diffLoading, setDiffLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [changeDescription, setChangeDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [confirmRollback, setConfirmRollback] = useState<number | null>(null);
  const [rollbackLoading, setRollbackLoading] = useState(false);

  const loadVersions = useCallback(async () => {
    if (!canvasId) return;
    setLoading(true);
    try {
      const data = await fetchVersions(canvasId);
      setVersions(data);
    } catch (err) {
      console.error("Failed to load versions", err);
    } finally {
      setLoading(false);
    }
  }, [canvasId]);

  useEffect(() => {
    if (showVersionPanel && canvasId) {
      loadVersions();
    }
  }, [showVersionPanel, canvasId, loadVersions]);

  const handleCreateSnapshot = useCallback(async () => {
    if (!canvasId || !changeDescription.trim()) return;
    setCreating(true);
    try {
      await createVersion(canvasId, changeDescription.trim());
      setChangeDescription("");
      setCreateDialogOpen(false);
      await loadVersions();
    } catch (err) {
      console.error("Failed to create version", err);
    } finally {
      setCreating(false);
    }
  }, [canvasId, changeDescription, loadVersions]);

  const handleRollback = useCallback(
    async (version: number) => {
      if (!canvasId) return;
      setRollbackLoading(true);
      try {
        await rollbackToVersion(canvasId, version);
        setConfirmRollback(null);
        await loadVersions();
      } catch (err) {
        console.error("Failed to rollback", err);
      } finally {
        setRollbackLoading(false);
      }
    },
    [canvasId, loadVersions],
  );

  const handleCompare = useCallback(async () => {
    if (!canvasId || versionA == null || versionB == null) return;
    setDiffLoading(true);
    try {
      const diffData = await (
        await import("../../services/versionApi")
      ).fetchVersionDiff(canvasId, versionA, versionB);
      setDiff(diffData);
    } catch (err) {
      console.error("Failed to load diff", err);
    } finally {
      setDiffLoading(false);
    }
  }, [canvasId, versionA, versionB]);

  const handleCloseDiff = useCallback(() => {
    setDiff(null);
    setCompareMode(false);
    setVersionA(null);
    setVersionB(null);
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  if (!showVersionPanel) return null;

  if (diff) {
    return (
      <div className="w-80 bg-white border-l border-slate-100 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-lime" />
            <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">
              Comparar Versões
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-slate-400 hover:text-brand-navy"
            onClick={handleCloseDiff}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
        <VersionDiffView diff={diff} />
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-l border-slate-100 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-lime" />
          <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">
            Histórico de Versões
          </span>
        </div>
        <div className="flex items-center gap-1">
          {versions.length >= 2 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-slate-400 hover:text-brand-navy"
              onClick={() => setCompareMode(!compareMode)}
              title="Comparar versões"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-slate-400 hover:text-brand-navy"
            onClick={toggleVersionPanel}
            title="Fechar"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {createDialogOpen && (
        <div className="px-4 py-3 border-b border-slate-100 space-y-2">
          <input
            type="text"
            value={changeDescription}
            onChange={(e) => setChangeDescription(e.target.value)}
            placeholder="Descreva esta versão..."
            className="w-full text-sm px-3 py-2 bg-slate-50 border-slate-200 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary"
            onKeyDown={(e) => e.key === "Enter" && handleCreateSnapshot()}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 bg-brand-navy text-white rounded-lg hover:bg-brand-navy/90 shadow-lg shadow-brand-navy/20"
              onClick={handleCreateSnapshot}
              disabled={creating || !changeDescription.trim()}
            >
              {creating ? "Salvando..." : "Salvar"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-lg border-slate-200"
              onClick={() => {
                setCreateDialogOpen(false);
                setChangeDescription("");
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {compareMode && (
        <div className="px-4 py-3 border-b border-slate-100 space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-lime" />
            <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              Comparar Versões
            </span>
          </div>
          <div className="flex gap-2">
            <select
              className="flex-1 text-xs px-2 py-1.5 bg-slate-50 border-slate-200 rounded-lg"
              value={versionA ?? ""}
              onChange={(e) =>
                setVersionA(e.target.value ? Number(e.target.value) : null)
              }
            >
              <option value="">De...</option>
              {versions.map((v) => (
                <option key={v.version} value={v.version}>
                  v{v.version}
                </option>
              ))}
            </select>
            <select
              className="flex-1 text-xs px-2 py-1.5 bg-slate-50 border-slate-200 rounded-lg"
              value={versionB ?? ""}
              onChange={(e) =>
                setVersionB(e.target.value ? Number(e.target.value) : null)
              }
            >
              <option value="">Para...</option>
              {versions.map((v) => (
                <option key={v.version} value={v.version}>
                  v{v.version}
                </option>
              ))}
            </select>
          </div>
          <Button
            size="sm"
            className="w-full bg-brand-navy text-white rounded-lg hover:bg-brand-navy/90 shadow-lg shadow-brand-navy/20"
            onClick={handleCompare}
            disabled={
              versionA == null ||
              versionB == null ||
              versionA === versionB ||
              diffLoading
            }
          >
            {diffLoading ? "Carregando..." : "Comparar"}
          </Button>
        </div>
      )}

      <div className="px-4 py-2 border-b border-slate-100">
        <Button
          size="sm"
          variant="outline"
          className="w-full gap-1.5 rounded-lg border-slate-200"
          onClick={() => setCreateDialogOpen(!createDialogOpen)}
        >
          <Plus className="h-3.5 w-3.5" />
          Criar Snapshot
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">
            Carregando...
          </div>
        ) : versions.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-ice-blue flex items-center justify-center mx-auto">
              <History className="h-5 w-5 text-brand-navy" />
            </div>
            <div className="text-sm font-medium text-brand-navy">
              Nenhuma versão
            </div>
            <div className="text-xs text-slate-400">
              Crie um snapshot para salvar o estado atual do canvas
            </div>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {versions.map((version) => (
              <div
                key={version.id}
                className={`rounded-xl border p-3 cursor-pointer transition-colors bg-white card-shadow ${
                  selectedVersion?.id === version.id
                    ? "border-brand-navy/20 ring-1 ring-brand-navy/10"
                    : "border-slate-100 hover:border-slate-200"
                }`}
                onClick={() =>
                  setSelectedVersion(
                    selectedVersion?.id === version.id ? null : version,
                  )
                }
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-brand-navy font-display">
                    v{version.version}
                  </span>
                  {compareMode && (
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 rounded border-slate-300"
                      checked={
                        versionA === version.version ||
                        versionB === version.version
                      }
                      onChange={() => {
                        if (versionA === null) setVersionA(version.version);
                        else if (
                          versionB === null &&
                          version.version !== versionA
                        )
                          setVersionB(version.version);
                        else {
                          setVersionA(null);
                          setVersionB(null);
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                </div>
                {version.changeDescription && (
                  <div className="text-xs text-slate-600 mb-1.5 line-clamp-2">
                    {version.changeDescription}
                  </div>
                )}
                <div className="flex items-center gap-3 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(version.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {version.createdBy}
                  </span>
                </div>

                {selectedVersion?.id === version.id && (
                  <div className="mt-2 pt-2 border-t border-slate-100 space-y-1.5">
                    <Separator className="bg-slate-100" />
                    {confirmRollback === version.version ? (
                      <div className="flex gap-2 mt-1">
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1 text-xs h-7 rounded-lg"
                          onClick={() => handleRollback(version.version)}
                          disabled={rollbackLoading}
                        >
                          {rollbackLoading ? "Restaurando..." : "Confirmar"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs h-7 rounded-lg border-slate-200"
                          onClick={() => setConfirmRollback(null)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full gap-1.5 text-xs h-7 rounded-lg border-slate-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmRollback(version.version);
                        }}
                      >
                        <RotateCcw className="h-3 w-3" />
                        Restaurar esta versão
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
