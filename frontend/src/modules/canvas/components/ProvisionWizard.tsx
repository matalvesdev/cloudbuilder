import { useState, useCallback, useEffect } from "react";
import {
  Cloud,
  Sparkles,
  Play,
  Check,
  ArrowRight,
  ArrowLeft,
  X,
  Loader2,
  Shield,
  FileCode,
  Server,
  Network,
  Database,
  Copy,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/lib/toast";
import { useCanvasStore } from "@/store/canvasStore";
import { useAuthStore } from "@/store/authStore";
import { provisionApi, type PreviewResponse } from "@/api/provision";
import { allComponents } from "./properties/providerDefinitions";
import type { ProviderType } from "@/types/canvas.types";

interface ProvisionWizardProps {
  onComplete: () => void;
  onSkip: () => void;
}

type WizardStep = "welcome" | "design" | "generate" | "connect" | "provision";

const STEP_CONFIG = [
  { key: "welcome", title: "Bem-vindo", icon: Cloud },
  { key: "design", title: "Design", icon: Network },
  { key: "generate", title: "Gerar", icon: FileCode },
  { key: "connect", title: "Conectar", icon: Shield },
  { key: "provision", title: "Provisionar", icon: Play },
];

const TEMPLATES = [
  {
    key: "gcp-simple",
    title: "GCP Simples",
    description: "VPC + Subnet + VM + SQL",
    provider: "gcp" as ProviderType,
    color: "bg-blue-50 border-blue-200 text-blue-700",
    components: [
      { id: "gcp-vpc", label: "VPC", resourceType: "google_compute_network" },
      { id: "gcp-subnet", label: "Subnet", resourceType: "google_compute_subnetwork" },
      { id: "gcp-vm", label: "VM", resourceType: "google_compute_instance" },
      { id: "gcp-sql", label: "SQL", resourceType: "google_sql_database_instance" },
    ],
  },
  {
    key: "aws-simple",
    title: "AWS Simples",
    description: "VPC + Subnet + EC2 + RDS",
    provider: "aws" as ProviderType,
    color: "bg-orange-50 border-orange-200 text-orange-700",
    components: [
      { id: "aws-vpc", label: "VPC", resourceType: "aws_vpc" },
      { id: "aws-subnet", label: "Subnet", resourceType: "aws_subnet" },
      { id: "aws-ec2", label: "EC2", resourceType: "aws_instance" },
      { id: "aws-rds", label: "RDS", resourceType: "aws_db_instance" },
    ],
  },
  {
    key: "azure-simple",
    title: "Azure Simples",
    description: "VNet + Subnet + VM + SQL",
    provider: "azure" as ProviderType,
    color: "bg-blue-50 border-blue-200 text-blue-600",
    components: [
      { id: "azure-vnet", label: "VNet", resourceType: "azurerm_virtual_network" },
      { id: "azure-subnet", label: "Subnet", resourceType: "azurerm_subnet" },
      { id: "azure-vm", label: "VM", resourceType: "azurerm_linux_virtual_machine" },
      { id: "azure-sql", label: "SQL", resourceType: "azurerm_mssql_database" },
    ],
  },
];

export function ProvisionWizard({ onComplete, onSkip }: ProvisionWizardProps) {
  const [step, setStep] = useState<WizardStep>("welcome");
  const [selectedTemplate, setSelectedTemplate] = useState<typeof TEMPLATES[0] | null>(null);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMainTf, setShowMainTf] = useState(false);
  const [credentialName, setCredentialName] = useState("");
  const [credentialKey, setCredentialKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [provisionResult, setProvisionResult] = useState<any>(null);

  const { addNode, autoLayout, clearCanvas, nodes } = useCanvasStore();
  const { user } = useAuthStore();

  const currentStepIndex = STEP_CONFIG.findIndex((s) => s.key === step);

  const goNext = useCallback(() => {
    const idx = STEP_CONFIG.findIndex((s) => s.key === step);
    if (idx < STEP_CONFIG.length - 1) {
      setStep(STEP_CONFIG[idx + 1].key as WizardStep);
    }
  }, [step]);

  const goPrev = useCallback(() => {
    const idx = STEP_CONFIG.findIndex((s) => s.key === step);
    if (idx > 0) {
      setStep(STEP_CONFIG[idx - 1].key as WizardStep);
    }
  }, [step]);

  // Step 1: Load template into canvas
  const loadTemplate = useCallback(async (template: typeof TEMPLATES[0]) => {
    setSelectedTemplate(template);
    clearCanvas();
    
    // Add nodes from template
    for (const comp of template.components) {
      const componentDef = allComponents.find((c) => c.resourceType === comp.resourceType);
      if (componentDef) {
        addNode(componentDef, {
          x: 150 + Math.random() * 400,
          y: 100 + Math.random() * 300,
        });
      }
    }
    
    // Auto-layout after a short delay
    setTimeout(() => autoLayout(), 200);
    goNext();
  }, [addNode, autoLayout, clearCanvas, goNext]);

  // Step 3: Generate Terraform
  const handleGenerate = useCallback(async () => {
    const canvasId = useCanvasStore.getState().canvasId;
    if (!canvasId) {
      showError("Canvas não encontrado. Crie um canvas primeiro.");
      return;
    }
    
    setLoading(true);
    try {
      const data = await provisionApi.previewProvision(canvasId, "terraform");
      setPreview(data);
      goNext();
    } catch (err: any) {
      showError(err.message || "Falha ao gerar código");
    } finally {
      setLoading(false);
    }
  }, [goNext]);

  // Step 5: Provision — backend proxies Go engine with resilience
  const handleProvision = useCallback(async () => {
    const canvasId = useCanvasStore.getState().canvasId;
    if (!canvasId || !preview) return;
    
    setLoading(true);
    try {
      const result = await provisionApi.executeProvision(canvasId, {
        credentialId: "",
        engine: preview.engine as "terraform" | "opentofu",
        autoApprove: false,
      });
      setProvisionResult(result);
      goNext();
    } catch (err: any) {
      showError(err.message || "Falha no provisioning");
    } finally {
      setLoading(false);
    }
  }, [preview, goNext]);

  const handleComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-navy flex items-center justify-center">
              <Cloud className="h-4 w-4 text-brand-lime" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-brand-navy">
                CloudBuilder Setup
              </h2>
              <p className="text-xs text-slate-400">
                Design → Gerar → Provisionar
              </p>
            </div>
          </div>
          <button
            onClick={onSkip}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicators */}
        <div className="px-6 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            {STEP_CONFIG.map((s, idx) => {
              const Icon = s.icon;
              const isActive = idx === currentStepIndex;
              const isCompleted = idx < currentStepIndex;
              return (
                <div key={s.key} className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                      isCompleted
                        ? "bg-brand-lime text-brand-navy"
                        : isActive
                          ? "bg-brand-navy text-white"
                          : "bg-slate-100 text-slate-400"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Icon className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium hidden sm:inline",
                      isActive ? "text-brand-navy" : "text-slate-400"
                    )}
                  >
                    {s.title}
                  </span>
                  {idx < STEP_CONFIG.length - 1 && (
                    <div className="w-6 h-px bg-slate-200 mx-1" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === "welcome" && (
            <WelcomeStep onLoadTemplate={loadTemplate} onSkip={onSkip} />
          )}
          {step === "design" && (
            <DesignStep template={selectedTemplate} onNext={goNext} />
          )}
          {step === "generate" && (
            <GenerateStep
              preview={preview}
              loading={loading}
              showMainTf={showMainTf}
              onToggleMainTf={() => setShowMainTf(!showMainTf)}
              onGenerate={handleGenerate}
              onNext={goNext}
              onPrev={goPrev}
              hasNodes={nodes.length > 0}
            />
          )}
          {step === "connect" && (
            <ConnectStep
              credentialName={credentialName}
              setCredentialName={setCredentialName}
              credentialKey={credentialKey}
              setCredentialKey={setCredentialKey}
              showKey={showKey}
              setShowKey={setShowKey}
              onNext={goNext}
              onPrev={goPrev}
            />
          )}
          {step === "provision" && (
            <ProvisionStep
              result={provisionResult}
              loading={loading}
              onProvision={handleProvision}
              onComplete={handleComplete}
              onPrev={goPrev}
              hasPreview={!!preview}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onSkip}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            Pular configuração
          </button>
          <div className="text-xs text-slate-400">
            Passo {currentStepIndex + 1} de {STEP_CONFIG.length}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step Components ──────────────────────────────────────────────

function WelcomeStep({
  onLoadTemplate,
  onSkip,
}: {
  onLoadTemplate: (template: typeof TEMPLATES[0]) => void;
  onSkip: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-navy/10 mb-4">
          <Cloud className="w-8 h-8 text-brand-navy" />
        </div>
        <h3 className="text-lg font-bold text-brand-navy mb-2">
          Bem-vindo ao CloudBuilder
        </h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Vamos criar sua primeira infraestrutura em 4 passos simples.
          Escolha um template para começar rapidamente.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {TEMPLATES.map((template) => (
          <button
            key={template.key}
            onClick={() => onLoadTemplate(template)}
            className={cn(
              "group flex flex-col items-start gap-3 p-4 border-2 rounded-xl transition-all text-left",
              "hover:shadow-md hover:-translate-y-0.5",
              template.color
            )}
          >
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4" />
              <span className="text-sm font-bold">{template.title}</span>
            </div>
            <p className="text-xs opacity-70">{template.description}</p>
            <div className="flex items-center gap-1 text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider">
              Começar <ArrowRight className="w-3 h-3" />
            </div>
          </button>
        ))}
      </div>

      <div className="text-center">
        <button
          onClick={onSkip}
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          Já tenho um design — pular para o canvas
        </button>
      </div>
    </div>
  );
}

function DesignStep({
  template,
  onNext,
}: {
  template: typeof TEMPLATES[0] | null;
  onNext: () => void;
}) {
  const nodes = useCanvasStore((s) => s.nodes);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-lime/20 mb-3">
          <Network className="w-6 h-6 text-brand-navy" />
        </div>
        <h3 className="text-base font-bold text-brand-navy mb-1">
          Design carregado
        </h3>
        <p className="text-sm text-slate-500">
          {nodes.length} recursos adicionados ao canvas.
          Feche este wizard para editar no canvas.
        </p>
      </div>

      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <p className="text-xs text-slate-500 mb-2">Recursos adicionados:</p>
        <div className="flex flex-wrap gap-2">
          {nodes.map((node) => (
            <span
              key={node.id}
              className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-medium text-brand-navy"
            >
              {node.data?.label || node.data?.resourceType || "Resource"}
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={onNext} className="flex-1 bg-brand-navy text-white">
          Próximo: Gerar Terraform
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

function GenerateStep({
  preview,
  loading,
  showMainTf,
  onToggleMainTf,
  onGenerate,
  onNext,
  onPrev,
  hasNodes,
}: {
  preview: PreviewResponse | null;
  loading: boolean;
  showMainTf: boolean;
  onToggleMainTf: () => void;
  onGenerate: () => void;
  onNext: () => void;
  onPrev: () => void;
  hasNodes: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-lime/20 mb-3">
          <FileCode className="w-6 h-6 text-brand-navy" />
        </div>
        <h3 className="text-base font-bold text-brand-navy mb-1">
          Gerar Código Terraform
        </h3>
        <p className="text-sm text-slate-500">
          Converta seu design em código Terraform pronto para deploy.
        </p>
      </div>

      {!preview ? (
        <div className="flex justify-center">
          <Button
            onClick={onGenerate}
            disabled={loading || !hasNodes}
            className="bg-brand-navy text-white"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {loading ? "Gerando..." : "Gerar Código"}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <Check className="w-4 h-4 text-emerald-600" />
            <div>
              <p className="text-xs font-semibold text-emerald-800">
                Código gerado com sucesso
              </p>
              <p className="text-xs text-emerald-600">
                {preview.resourceCount} recursos · {Object.keys(preview.files).length} arquivos
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
            {showMainTf ? "Ocultar" : "Ver"} main.tf
          </button>

          {showMainTf && (
            <pre className="p-3 bg-slate-900 text-emerald-400 text-[11px] font-mono rounded-lg overflow-x-auto max-h-[200px] overflow-y-auto">
              {preview.files["main.tf"] || "# empty"}
            </pre>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onPrev} className="flex-1">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Button
          onClick={onNext}
          disabled={!preview}
          className="flex-1 bg-brand-navy text-white"
        >
          Próximo: Conectar
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

function ConnectStep({
  credentialName,
  setCredentialName,
  credentialKey,
  setCredentialKey,
  showKey,
  setShowKey,
  onNext,
  onPrev,
}: {
  credentialName: string;
  setCredentialName: (v: string) => void;
  credentialKey: string;
  setCredentialKey: (v: string) => void;
  showKey: boolean;
  setShowKey: (v: boolean) => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-lime/20 mb-3">
          <Shield className="w-6 h-6 text-brand-navy" />
        </div>
        <h3 className="text-base font-bold text-brand-navy mb-1">
          Conectar Credenciais
        </h3>
        <p className="text-sm text-slate-500">
          Adicione as credenciais do provedor para provisionar.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-slate-700 mb-1.5 block">
            Nome da credencial
          </label>
          <input
            type="text"
            value={credentialName}
            onChange={(e) => setCredentialName(e.target.value)}
            placeholder="Ex: GCP Production SA"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-700 mb-1.5 block">
            Chave de serviço (JSON)
          </label>
          <div className="relative">
            <textarea
              value={credentialKey}
              onChange={(e) => setCredentialKey(e.target.value)}
              placeholder='{"type": "service_account", "project_id": "...", ...}'
              rows={4}
              className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy resize-none"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute top-2 right-2 p-1 rounded hover:bg-slate-100 text-slate-400"
            >
              {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Sua chave é criptografada e nunca é exposta em logs.
          </p>
        </div>
      </div>

      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-xs text-amber-800">
          <strong>Dica:</strong> Comece com permissões read-only para validar.
          Depois, adicione permissões de escrita para provisioning.
        </p>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onPrev} className="flex-1">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Button
          onClick={onNext}
          disabled={!credentialName || !credentialKey}
          className="flex-1 bg-brand-navy text-white"
        >
          Próximo: Provisionar
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

function ProvisionStep({
  result,
  loading,
  onProvision,
  onComplete,
  onPrev,
  hasPreview,
}: {
  result: any;
  loading: boolean;
  onProvision: () => void;
  onComplete: () => void;
  onPrev: () => void;
  hasPreview: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-lime/20 mb-3">
          <Play className="w-6 h-6 text-brand-navy" />
        </div>
        <h3 className="text-base font-bold text-brand-navy mb-1">
          Provisionar Infraestrutura
        </h3>
        <p className="text-sm text-slate-500">
          Envie o código Terraform para o provedor cloud.
        </p>
      </div>

      {!result ? (
        <div className="flex justify-center">
          <Button
            onClick={onProvision}
            disabled={loading || !hasPreview}
            className="bg-brand-lime text-brand-navy font-bold"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            {loading ? "Provisionando..." : "Provisionar Agora"}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start gap-2 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">
                Provisionamento preparado!
              </p>
              <p className="text-xs text-emerald-600 mt-1">
                {result.resourceCount} recursos prontos para deploy.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <p className="text-xs text-slate-500 mb-2">Próximos passos:</p>
            <ol className="space-y-2 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-navy text-white flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                <span>Revise o código Terraform gerado</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-navy text-white flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                <span>Verifique as credenciais configuradas</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-navy text-white flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
                <span>Clique em "Aplicar" no módulo de Provisionamento</span>
              </li>
            </ol>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onPrev} className="flex-1">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Button
          onClick={onComplete}
          className="flex-1 bg-brand-navy text-white"
        >
          {result ? "Ir para o Canvas" : "Pular por agora"}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
