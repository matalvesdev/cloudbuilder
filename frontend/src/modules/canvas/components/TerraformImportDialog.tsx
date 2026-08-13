import { useState, useCallback, useRef } from "react";
import {
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  X,
  Cloud,
  ArrowRight,
  Loader2,
  FileCode,
  Eye,
} from "lucide-react";
import { importTerraform } from "@/api/import";
import { useCanvasStore } from "@/store/canvasStore";
import type {
  ParsedResource,
  ParsedConnection,
  ImportTerraformResponse,
} from "@/api/types";
import { cn } from "@/lib/utils";

interface TerraformImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TerraformImportDialog({
  open,
  onOpenChange,
}: TerraformImportDialogProps) {
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<ImportTerraformResponse | null>(null);
  const [error, setError] = useState("");
  const [selectedResources, setSelectedResources] = useState<Set<string>>(
    new Set(),
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const addNode = useCanvasStore((s) => s.addNode);
  const addEdgeWithType = useCanvasStore((s) => s.addEdgeWithType);
  const autoLayout = useCanvasStore((s) => s.autoLayout);
  const nodes = useCanvasStore((s) => s.nodes);

  const reset = useCallback(() => {
    setContent("");
    setFileName("");
    setResult(null);
    setError("");
    setSelectedResources(new Set());
    setParsing(false);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onOpenChange(false);
  }, [onOpenChange, reset]);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        setContent(text);
        setResult(null);
        setError("");
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    [],
  );

  const handlePasteAreaClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleParse = useCallback(async () => {
    if (!content.trim()) {
      setError("Cole ou faça upload de um arquivo Terraform primeiro.");
      return;
    }
    setParsing(true);
    setError("");
    try {
      const response = await importTerraform(content);
      setResult(response);
      // Pre-select all resources by default
      setSelectedResources(
        new Set(response.resources.map((r) => `${r.resourceType}.${r.name}`)),
      );
    } catch (err: any) {
      setError(
        err?.message ||
          "Erro ao processar o arquivo. Verifique se o conteúdo é válido.",
      );
    } finally {
      setParsing(false);
    }
  }, [content]);

  const toggleResource = useCallback((key: string) => {
    setSelectedResources((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handleImport = useCallback(async () => {
    if (!result) return;
    const { resources, connections } = result;

    // Build name → node ID mapping
    const nameToId = new Map<string, string>();

    // Add selected resources as canvas nodes
    const selectedRes = resources.filter((r) =>
      selectedResources.has(`${r.resourceType}.${r.name}`),
    );
    const cols = Math.max(1, Math.ceil(Math.sqrt(selectedRes.length)));

    for (let i = 0; i < selectedRes.length; i++) {
      const res = selectedRes[i];
      const resourceKey = `${res.resourceType}.${res.name}`;

      const displayName =
        res.displayType !== res.resourceType
          ? `${res.displayType}: ${res.name}`
          : res.name;

      addNode(
        {
          id: res.resourceType,
          displayName,
          provider: res.provider,
          resourceType: res.resourceType,
        },
        { x: 80 + (i % cols) * 300, y: 80 + Math.floor(i / cols) * 180 },
      );

      const store = useCanvasStore.getState();
      const newNode = store.nodes[store.nodes.length - 1];
      if (newNode) {
        nameToId.set(resourceKey, newNode.id);
      }
    }

    // Add connections between selected resources
    for (const conn of connections) {
      const sourceId = nameToId.get(conn.sourceResourceName);
      const targetId = nameToId.get(conn.targetResourceName);
      if (sourceId && targetId) {
        addEdgeWithType(sourceId, targetId, "default");
      }
    }

    // Auto-layout the imported nodes (await to ensure layout completes)
    await new Promise((r) => setTimeout(r, 50));
    await autoLayout();

    handleClose();
  }, [
    result,
    selectedResources,
    nodes,
    addNode,
    addEdgeWithType,
    autoLayout,
    handleClose,
  ]);

  if (!open) return null;

  const resourceCount = result?.resources.length ?? 0;
  const selectedCount = selectedResources.size;
  const connectionCount = result?.connections.length ?? 0;

  // Group resources by provider
  const groupedResources = result
    ? groupBy(result.resources, (r) => r.provider)
    : new Map<string, ParsedResource[]>();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-ice-blue/50 flex items-center justify-center">
              <FileCode className="w-5 h-5 text-brand-navy" />
            </div>
            <div>
              <h2 className="text-base font-bold text-brand-navy font-display">
                Importar Terraform
              </h2>
              <p className="text-xs text-slate-400">
                Faça upload de um arquivo .tf existente para criar o diagrama
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Upload area */}
          {!result && (
            <div
              onClick={handlePasteAreaClick}
              className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-brand-navy/40 hover:bg-slate-50/50 transition-all"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".tf,.tf.json,.hcl,.json,.yml,.yaml"
                className="hidden"
                onChange={handleFileSelect}
              />
              <div className="w-12 h-12 rounded-2xl bg-ice-blue/50 flex items-center justify-center mx-auto mb-3">
                <Upload className="w-6 h-6 text-brand-navy/60" />
              </div>
              <p className="text-sm font-medium text-brand-navy mb-1">
                {fileName || "Clique para selecionar um arquivo"}
              </p>
              <p className="text-xs text-slate-400">
                ou cole o conteúdo Terraform abaixo
              </p>
            </div>
          )}

          {/* Text area for pasting HCL */}
          {!result && (
            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setResult(null);
                setError("");
              }}
              placeholder={`resource "aws_vpc" "main" {\n  cidr_block = "10.0.0.0/16"\n  tags = { Name = "prod" }\n}\n\nresource "aws_subnet" "main" {\n  vpc_id = aws_vpc.main.id\n  cidr_block = "10.0.1.0/24"\n}`}
              className="w-full h-40 px-4 py-3 text-xs font-mono text-slate-700 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-brand-lime/60 focus:border-brand-navy placeholder:text-slate-300"
              spellCheck={false}
            />
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Warnings */}
          {result?.warnings && result.warnings.length > 0 && (
            <div className="space-y-1">
              {result.warnings.map((w, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 px-4 py-2 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700"
                >
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}

          {/* Preview */}
          {result && (
            <div className="space-y-4">
              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="px-4 py-3 bg-ice-blue/30 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-400 font-medium">Recursos</p>
                  <p className="text-xl font-bold text-brand-navy">
                    {resourceCount}
                  </p>
                </div>
                <div className="px-4 py-3 bg-ice-blue/30 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-400 font-medium">
                    Selecionados
                  </p>
                  <p className="text-xl font-bold text-brand-navy">
                    {selectedCount}/{resourceCount}
                  </p>
                </div>
                <div className="px-4 py-3 bg-ice-blue/30 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-400 font-medium">Conexões</p>
                  <p className="text-xl font-bold text-brand-navy">
                    {connectionCount}
                  </p>
                </div>
              </div>

              {/* Resource list by provider */}
              {Array.from(groupedResources.entries()).map(
                ([provider, providerResources]) => (
                  <div key={provider} className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        {provider}
                      </span>
                      <span className="text-[10px] text-slate-300">·</span>
                      <span className="text-[10px] text-slate-400">
                        {providerResources.length} recursos
                      </span>
                    </div>
                    <div className="space-y-1">
                      {providerResources.map((res) => {
                        const key = `${res.resourceType}.${res.name}`;
                        const isSelected = selectedResources.has(key);
                        return (
                          <div
                            key={key}
                            onClick={() => toggleResource(key)}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-xl border cursor-pointer transition-all",
                              isSelected
                                ? "border-brand-navy/20 bg-brand-navy/5"
                                : "border-slate-100 bg-white hover:border-slate-200",
                            )}
                          >
                            <div
                              className={cn(
                                "w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all",
                                isSelected
                                  ? "border-brand-navy bg-brand-navy"
                                  : "border-slate-300",
                              )}
                            >
                              {isSelected && (
                                <CheckCircle2 className="w-3 h-3 text-brand-lime" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-brand-navy truncate">
                                  {res.name}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono">
                                  {res.resourceType}
                                </span>
                              </div>
                              {res.isDataSource && (
                                <span className="text-[10px] text-amber-600 font-medium">
                                  Data Source
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ),
              )}

              {/* Connections preview */}
              {connectionCount > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Conexões Detectadas
                    </span>
                  </div>
                  <div className="space-y-1">
                    {result.connections.map((conn, i) => {
                      const sourceSelected = selectedResources.has(
                        conn.sourceResourceName,
                      );
                      const targetSelected = selectedResources.has(
                        conn.targetResourceName,
                      );
                      return (
                        <div
                          key={i}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-xl border text-xs",
                            sourceSelected && targetSelected
                              ? "border-slate-100 bg-white"
                              : "border-slate-100 bg-slate-50 text-slate-400",
                          )}
                        >
                          <span className="font-mono text-xs truncate">
                            {conn.sourceResourceName}
                          </span>
                          <ArrowRight className="w-3 h-3 shrink-0" />
                          <span className="font-mono text-xs truncate">
                            {conn.targetResourceName}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Cloud className="w-3.5 h-3.5" />
            {result
              ? `${selectedCount} recursos serão importados`
              : "Suporta .tf, .tf.json, .hcl"}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            {!result ? (
              <button
                onClick={handleParse}
                disabled={parsing || !content.trim()}
                className={cn(
                  "px-4 py-2 text-sm font-semibold rounded-xl transition-all flex items-center gap-2",
                  parsing || !content.trim()
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-brand-navy text-brand-lime hover:bg-brand-navy/90 shadow-sm",
                )}
              >
                {parsing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Analisando...
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" /> Visualizar
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleImport}
                disabled={selectedCount === 0}
                className={cn(
                  "px-4 py-2 text-sm font-semibold rounded-xl transition-all flex items-center gap-2",
                  selectedCount === 0
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-brand-navy text-brand-lime hover:bg-brand-navy/90 shadow-sm",
                )}
              >
                <FileCode className="w-4 h-4" />
                Importar {selectedCount} recurso{selectedCount !== 1 ? "s" : ""}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function groupBy<T>(items: T[], keyFn: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    const group = map.get(key) || [];
    group.push(item);
    map.set(key, group);
  }
  return map;
}
