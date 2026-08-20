import { useState, useEffect, useCallback } from "react";
import {
  Cloud,
  Play,
  Eye,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Copy,
  Shield,
  FileCode,
  Server,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/lib/toast";
import {
  provisionApi,
  type ProvisionResponse,
  type ProvisionResult,
  type Credential,
  type PreviewResponse,
} from "@/api/provision";
import { useCanvasStore } from "@/store/canvasStore";
import { useAuthStore } from "@/store/authStore";
import { showInfo } from "@/lib/toast";

interface ProvisionPanelProps {
  onClose: () => void;
}

type PanelView = "idle" | "preview" | "credentials" | "provisioning" | "result";

export function ProvisionPanel({ onClose }: ProvisionPanelProps) {
  const canvasId = useCanvasStore((s) => s.canvasId);
  const nodes = useCanvasStore((s) => s.nodes);
  const authUser = useAuthStore((s) => s.user);

  const [view, setView] = useState<PanelView>("idle");
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [selectedCredId, setSelectedCredId] = useState<string>("");
  const [engine, setEngine] = useState<"terraform" | "opentofu">("terraform");
  const [autoApprove, setAutoApprove] = useState(false);
  const [result, setResult] = useState<ProvisionResult | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showMainTf, setShowMainTf] = useState(false);

  // Load credentials on mount
  useEffect(() => {
    if (authUser?.tenantId) {
      provisionApi
        .listCredentials(authUser.tenantId)
        .then((creds) => setCredentials(creds))
        .catch(() => {});
    }
  }, [authUser?.tenantId]);

  // Generate preview
  const handlePreview = useCallback(async () => {
    if (!canvasId) {
      setError("Canvas não salvo. Salve o canvas antes de gerar o preview.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await provisionApi.previewProvision(canvasId, engine);
      setPreview(data);
      setView("preview");
    } catch (err: any) {
      setError(err.message || "Falha ao gerar preview");
    } finally {
      setLoading(false);
    }
  }, [canvasId, engine]);

  // Proceed to credentials selection
  const handleProceedToCredentials = useCallback(() => {
    setView("credentials");
  }, []);

  // Execute provisioning — backend proxies Go engine with resilience
  const handleProvision = useCallback(async () => {
    if (!canvasId || !selectedCredId) return;
    setLoading(true);
    setError("");
    setView("provisioning");
    try {
      const execResult = await provisionApi.executeProvision(canvasId, {
        credentialId: selectedCredId,
        engine,
        autoApprove,
      });
      setResult(execResult);

      if (execResult.status === "APPLIED") {
        // Clear canvas ONLY after successful apply (not on PLANNED)
        const tenantId = authUser?.tenantId;
        const userId = authUser?.id;
        useCanvasStore.setState({ nodes: [], edges: [], undoStack: [], redoStack: [] });
        if (tenantId && userId) {
          await useCanvasStore.getState().saveToBackend(tenantId, userId).catch(() => {});
        }
        useCanvasStore.getState().clearCanvas();
        localStorage.removeItem("cloudbuilder-canvas");
        showSuccess("Infraestrutura provisionada! Canvas limpo para nova arquitetura.");
      } else if (execResult.status === "PLANNED") {
        showInfo("Terraform plan concluído — revisão necessária antes de aplicar.");
      } else {
        showInfo("Provisionamento concluído — verifique o resultado.");
      }

      setView("result");
    } catch (err: any) {
      setError(err.message || "Falha no provisionamento");
      setView("credentials");
    } finally {
      setLoading(false);
    }
  }, [canvasId, selectedCredId, engine, autoApprove, authUser?.tenantId, authUser?.id]);

  const resourceCount = preview?.resourceCount ?? nodes.length;
  const provider = preview?.provider ?? "unknown";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Cloud className="w-4 h-4 text-brand-navy" />
          <h3 className="text-sm font-semibold text-brand-navy">
            Provisionar
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-100 text-slate-400"
        >
          <XCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {view === "idle" && (
          <IdleView
            nodesCount={nodes.length}
            engine={engine}
            onEngineChange={setEngine}
            onPreview={handlePreview}
            loading={loading}
          />
        )}

        {view === "preview" && preview && (
          <PreviewView
            preview={preview}
            showMainTf={showMainTf}
            onToggleMainTf={() => setShowMainTf(!showMainTf)}
            onProceed={handleProceedToCredentials}
            onBack={() => setView("idle")}
          />
        )}

        {view === "credentials" && (
          <CredentialsView
            credentials={credentials}
            selectedCredId={selectedCredId}
            onSelect={setSelectedCredId}
            autoApprove={autoApprove}
            onAutoApproveChange={setAutoApprove}
            onProvision={handleProvision}
            onBack={() => setView("preview")}
            loading={loading}
          />
        )}

        {view === "provisioning" && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="w-8 h-8 text-brand-navy animate-spin" />
            <p className="text-sm text-slate-600">
              Executando Terraform init → plan
              {autoApprove ? " → apply" : ""}...
            </p>
          </div>
        )}

        {view === "result" && result && (
          <ResultView result={result} onBack={() => setView("idle")} />
        )}

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-views ──────────────────────────────────────────────────────

function IdleView({
  nodesCount,
  engine,
  onEngineChange,
  onPreview,
  loading,
}: {
  nodesCount: number;
  engine: string;
  onEngineChange: (e: "terraform" | "opentofu") => void;
  onPreview: () => void;
  loading: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2 mb-2">
          <Server className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-medium text-slate-700">
            Recursos no canvas
          </span>
        </div>
        <p className="text-2xl font-bold text-brand-navy">{nodesCount}</p>
        <p className="text-xs text-slate-500 mt-1">
          nós serão convertidos em código Terraform
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-slate-700">
          Engine de provisionamento
        </label>
        <div className="flex gap-2">
          {(["terraform", "opentofu"] as const).map((eng) => (
            <button
              key={eng}
              onClick={() => onEngineChange(eng)}
              className={cn(
                "flex-1 px-3 py-2 text-xs font-medium rounded-lg border transition-all",
                engine === eng
                  ? "bg-brand-navy text-brand-lime border-brand-navy"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300",
              )}
            >
              {eng === "terraform" ? "Terraform" : "OpenTofu"}
            </button>
          ))}
        </div>
      </div>

      <Button
        onClick={onPreview}
        disabled={loading || nodesCount === 0}
        className="w-full bg-brand-navy text-brand-lime hover:bg-brand-navy/90"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Eye className="w-4 h-4 mr-2" />
        )}
        Gerar Preview Terraform
      </Button>

      {nodesCount === 0 && (
        <p className="text-xs text-slate-400 text-center">
          Adicione nós ao canvas antes de provisionar
        </p>
      )}
    </div>
  );
}

function PreviewView({
  preview,
  showMainTf,
  onToggleMainTf,
  onProceed,
  onBack,
}: {
  preview: PreviewResponse;
  showMainTf: boolean;
  onToggleMainTf: () => void;
  onProceed: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
        <CheckCircle className="w-4 h-4 text-emerald-600" />
        <div>
          <p className="text-xs font-semibold text-emerald-800">
            Terraform gerado com sucesso
          </p>
          <p className="text-xs text-emerald-600">
            {preview.resourceCount} recursos · {preview.provider} ·{" "}
            {Object.keys(preview.files).length} arquivos
          </p>
        </div>
      </div>

      {/* Files list */}
      <div className="space-y-1">
        {Object.entries(preview.files).map(([name, content]) => (
          <div
            key={name}
            className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded border border-slate-100"
          >
            <div className="flex items-center gap-2">
              <FileCode className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-mono text-slate-700">{name}</span>
            </div>
            <span className="text-[10px] text-slate-400">
              {content.split("\n").length} linhas
            </span>
          </div>
        ))}
      </div>

      {/* Expand main.tf */}
      <button
        onClick={onToggleMainTf}
        className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
      >
        {showMainTf ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
        {showMainTf ? "Ocultar" : "Ver"} main.tf
      </button>

      {showMainTf && (
        <pre className="p-3 bg-slate-900 text-emerald-400 text-[11px] font-mono rounded-lg overflow-x-auto max-h-[300px] overflow-y-auto">
          {preview.files["main.tf"] || "# empty"}
        </pre>
      )}

      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Voltar
        </Button>
        <Button
          onClick={onProceed}
          className="flex-1 bg-brand-navy text-brand-lime hover:bg-brand-navy/90"
        >
          <Shield className="w-4 h-4 mr-2" />
          Configurar Credenciais
        </Button>
      </div>
    </div>
  );
}

function CredentialsView({
  credentials,
  selectedCredId,
  onSelect,
  autoApprove,
  onAutoApproveChange,
  onProvision,
  onBack,
  loading,
}: {
  credentials: Credential[];
  selectedCredId: string;
  onSelect: (id: string) => void;
  autoApprove: boolean;
  onAutoApproveChange: (v: boolean) => void;
  onProvision: () => void;
  onBack: () => void;
  loading: boolean;
}) {
  const gcpCreds = credentials.filter(
    (c) => c.provider === "google" && c.isActive,
  );
  const awsCreds = credentials.filter(
    (c) => c.provider === "aws" && c.isActive,
  );
  const azureCreds = credentials.filter(
    (c) => c.provider === "azurerm" && c.isActive,
  );

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-slate-700 mb-2 block">
          Selecione a credencial do provedor
        </label>
        {credentials.length === 0 ? (
          <div className="p-4 text-center border-2 border-dashed border-slate-200 rounded-lg">
            <Shield className="w-6 h-6 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500">
              Nenhuma credencial configurada
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              Vá em Configurações → Credenciais para adicionar
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {gcpCreds.length > 0 && (
              <CredentialGroup
                label="Google Cloud"
                creds={gcpCreds}
                selectedId={selectedCredId}
                onSelect={onSelect}
              />
            )}
            {awsCreds.length > 0 && (
              <CredentialGroup
                label="AWS"
                creds={awsCreds}
                selectedId={selectedCredId}
                onSelect={onSelect}
              />
            )}
            {azureCreds.length > 0 && (
              <CredentialGroup
                label="Azure"
                creds={azureCreds}
                selectedId={selectedCredId}
                onSelect={onSelect}
              />
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <input
          type="checkbox"
          id="autoApprove"
          checked={autoApprove}
          onChange={(e) => onAutoApproveChange(e.target.checked)}
          className="rounded border-slate-300"
        />
        <label htmlFor="autoApprove" className="text-xs text-amber-800">
          Auto-apply (aplicar sem revisão do plan)
        </label>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Voltar
        </Button>
        <Button
          onClick={onProvision}
          disabled={!selectedCredId || loading}
          className="flex-1 bg-brand-lime text-brand-navy hover:bg-brand-lime/90 font-bold"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Play className="w-4 h-4 mr-2" />
          )}
          Provisionar
        </Button>
      </div>
    </div>
  );
}

function CredentialGroup({
  label,
  creds,
  selectedId,
  onSelect,
}: {
  label: string;
  creds: Credential[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-semibold text-slate-500 uppercase">
        {label}
      </p>
      {creds.map((cred) => (
        <button
          key={cred.id}
          onClick={() => onSelect(cred.id)}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 text-left rounded-lg border transition-all text-xs",
            selectedId === cred.id
              ? "bg-brand-navy/5 border-brand-navy text-brand-navy"
              : "bg-white border-slate-200 text-slate-700 hover:border-slate-300",
          )}
        >
          <Shield
            className={cn(
              "w-3.5 h-3.5",
              selectedId === cred.id ? "text-brand-navy" : "text-slate-400",
            )}
          />
          <span className="flex-1 truncate">{cred.name}</span>
          <span className="text-[10px] text-slate-400">{cred.authType}</span>
        </button>
      ))}
    </div>
  );
}

function ResultView({
  result,
  onBack,
}: {
  result: ProvisionResult;
  onBack: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const isSuccess = result.status === "APPLIED" || result.status === "PLANNED";
  const isFailed = result.status === "FAILED";

  const handleCopy = useCallback(() => {
    if (result.applyOutput) {
      navigator.clipboard.writeText(result.applyOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [result.applyOutput]);

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "flex items-start gap-2 p-3 rounded-lg border",
          isSuccess
            ? "bg-emerald-50 border-emerald-200"
            : "bg-red-50 border-red-200",
        )}
      >
        {isSuccess ? (
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
        ) : (
          <XCircle className="w-5 h-5 text-red-600 shrink-0" />
        )}
        <div>
          <p
            className={cn(
              "text-sm font-semibold",
              isSuccess ? "text-emerald-800" : "text-red-800",
            )}
          >
            {result.status === "APPLIED"
              ? "Provisionado com sucesso!"
              : result.status === "PLANNED"
                ? "Plan concluído — aguardando aprovação"
                : "Falha no provisionamento"}
          </p>
          <p
            className={cn(
              "text-xs mt-1",
              isSuccess ? "text-emerald-600" : "text-red-600",
            )}
          >
            {result.message}
          </p>
          {result.durationMs > 0 && (
            <p className="text-[10px] text-slate-400 mt-1">
              {(result.durationMs / 1000).toFixed(1)}s
            </p>
          )}
        </div>
      </div>

      {result.deploymentId && (
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded border border-slate-100">
          <span className="text-[10px] text-slate-500">Deployment ID:</span>
          <code className="text-[10px] font-mono text-slate-700 flex-1 truncate">
            {result.deploymentId}
          </code>
          <button
            onClick={handleCopy}
            className="p-1 rounded hover:bg-slate-200 text-slate-400"
          >
            <Copy className="w-3 h-3" />
          </button>
        </div>
      )}

      {(result.applyOutput || result.planOutput) && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-slate-500">
              {result.applyOutput ? "Apply Output" : "Plan Output"}
            </span>
            <button
              onClick={handleCopy}
              className="text-[10px] text-slate-400 hover:text-slate-600"
            >
              {copied ? "Copiado!" : "Copiar"}
            </button>
          </div>
          <pre className="p-3 bg-slate-900 text-emerald-400 text-[10px] font-mono rounded-lg overflow-x-auto max-h-[200px] overflow-y-auto">
            {result.applyOutput || result.planOutput}
          </pre>
        </div>
      )}

      {result.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs font-medium text-red-700 mb-1">Erro:</p>
          <pre className="text-[10px] text-red-600 font-mono whitespace-pre-wrap">
            {result.error}
          </pre>
        </div>
      )}

      <Button variant="outline" onClick={onBack} className="w-full">
        Novo provisionamento
      </Button>
    </div>
  );
}
