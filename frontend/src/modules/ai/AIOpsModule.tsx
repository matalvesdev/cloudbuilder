import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Send,
  Sparkles,
  Plus,
  CheckCircle,
  Bolt,
  Bot,
  AlertTriangle,
  BrainCircuit,
  X,
  AlertCircle,
  Activity,
  Search,
  LayoutDashboard,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Layers,
  Workflow,
  Wrench,
  Rocket,
  History,
  ToggleLeft,
  ToggleRight,
  FileCheck,
  Zap,
  Lightbulb,
  MessageSquare,
  BarChart3,
  Eye,
  Shield,
  BookOpen,
  FileText,
  GitPullRequest,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useCanvasStore } from "@/store/canvasStore";
import { useUiStore } from "@/store/uiStore";
import {
  useIncidentStore,
  type ResourceModification,
} from "@/store/incidentStore";
import {
  aiopsApi,
  type DesignTemplate,
  type MetricAnalysisResponse,
} from "@/api/aiops";
import { IncidentFixDialog } from "./IncidentFixDialog";
import { DesignPreview } from "./DesignPreview";
import { FixWidget } from "./FixWidget";
import { FixHistoryList } from "./FixHistory";
import { AutoRemediationPanel } from "./AutoRemediationPanel";
import { RunbooksPanel } from "./RunbooksPanel";
import { PostMortemPanel } from "./PostMortemPanel";
import type { ProviderType, CanvasDesign } from "@/types/canvas.types";
import type {
  Message,
  Incident,
  FixSuggestion,
  DesignChange,
} from "./aiops.types";
import {
  detectDesignIntent,
  getDesignSuggestions,
  generateCanvasDesign,
  PROVIDER_STYLES,
  severityColor,
  severityLabel,
  statusColor,
} from "./aiops.utils";

let designTemplates: DesignTemplate[] = [];

// Initialize templates from API (async, won't block rendering)
aiopsApi.getTemplates().then((templates) => {
  if (templates && templates.length > 0) {
    designTemplates = templates;
  }
});

export function AIOpsModule() {
  const {
    nodes,
    edges,
    canvasName,
    loadCanvas,
    updateNodeProperties,
    updateNodeLabel,
    setHighlightedIncidentNodes,
    clearHighlightedIncidentNodes,
  } = useCanvasStore();
  const { setActiveModule } = useUiStore();
  const {
    fixHistory,
    autoFixEnabled,
    toggleAutoFix,
    addFixHistory,
    markDeployed,
    markResult,
  } = useIncidentStore();

  const hasCanvasDesign = nodes.length > 0;
  const providers = useMemo(() => {
    const provSet = new Set(nodes.map((n) => n.data?.provider).filter(Boolean));
    return Array.from(provSet);
  }, [nodes]);

  const canvasContext = useMemo(() => {
    if (!hasCanvasDesign) return "";
    return [
      `Canvas atual: "${canvasName}"`,
      `Recursos no design: ${nodes.length}`,
      `Provedores: ${providers.join(", ") || "N/A"}`,
      `Conexões: ${edges.length}`,
      "Nós:",
      ...nodes.map(
        (n) =>
          `  - ${n.data?.label || "Sem nome"} (${n.data?.provider || "N/A"}/${n.data?.resourceType || "N/A"})`,
      ),
    ].join("\n");
  }, [nodes, edges, canvasName, hasCanvasDesign, providers]);

  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: crypto.randomUUID(),
      role: "assistant",
      content:
        "Olá! Sou o assistente de operações com IA do CloudBuilder. Como posso ajudar?",
      suggestions: [
        ...getDesignSuggestions(),
        ...(hasCanvasDesign
          ? [
              `Analisar design atual: "${canvasName}"`,
              "Analisar incidentes atuais",
              "Sugerir otimizações de custo",
            ]
          : [
              "Analisar incidentes atuais",
              "Sugerir otimizações de custo",
              "Verificar saúde da infraestrutura",
            ]),
        "Analisar métricas de CPU",
        "Analisar métricas de memória",
      ],
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [expandedResources, setExpandedResources] = useState<Set<string>>(
    new Set(),
  );
  const [fixDialogOpen, setFixDialogOpen] = useState(false);
  const [pendingFix, setPendingFix] = useState<{
    incidentId: string;
    incidentTitle: string;
    fixDescription: string;
    modifications: ResourceModification[];
  } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const environmentId = "default";

  // Sub-tab navigation for Incident Intelligence features
  const [aiopsTab, setAiopsTab] = useState<
    "chat" | "remediation" | "runbooks" | "postmortem"
  >("chat");

  const aiopsTabs = [
    { id: "chat" as const, label: "Chat", icon: MessageSquare },
    { id: "remediation" as const, label: "Auto-Remoção", icon: Shield },
    { id: "runbooks" as const, label: "Runbooks", icon: BookOpen },
    { id: "postmortem" as const, label: "Pós-Mortem", icon: FileText },
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // ─── Fetch real incidents from API ───────────────────────

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await aiopsApi.listIncidentsByEnvironment(environmentId);
      if (Array.isArray(data)) {
        setIncidents(data as unknown as Incident[]);
      }
    } catch {
      // API unavailable — incidents remain empty, user can retry
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  // ─── Design Response Generator ───────────────────────────

  const generateDesignResponse = useCallback(
    (templateId: string, userQuestion: string): Message => {
      const result = generateCanvasDesign(templateId, designTemplates);
      if (!result) {
        return {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "Não consegui gerar o design solicitado. Tente novamente com uma descrição diferente.",
        };
      }

      const { design, template } = result;
      const isModification = hasCanvasDesign;
      const resourceCount = template.resources.length;
      const connectionCount = template.connections.length;

      const designChanges: DesignChange[] = template.resources.map((r) => ({
        action: isModification ? ("add" as const) : ("add" as const),
        resource: r.label,
        description: `${r.provider.toUpperCase()} ${r.resourceType} - ${r.label}`,
      }));

      const content = isModification
        ? `## Alterações no Design: ${template.name}\n\nIdentifiquei que você deseja modificar o design atual. Baseado na sua solicitação, gerei as seguintes alterações:\n\n**${resourceCount} recursos** e **${connectionCount} conexões** serão adicionados ao canvas.\n\n${template.description}`
        : `## Design Gerado: ${template.name}\n\nCriei um novo design de infraestrutura baseado na sua solicitação. O design contém **${resourceCount} recursos** e **${connectionCount} conexões**.\n\n${template.description}\n\nClique em "Abrir no Canvas" para visualizar e editar o design completo.`;

      return {
        id: crypto.randomUUID(),
        role: "assistant",
        content,
        design,
        designName: template.name,
        isModification,
        designChanges,
        suggestions: [
          "Adicionar mais recursos a este design",
          "Otimizar custos deste design",
          "Exportar como Terraform",
          ...getDesignSuggestions(),
        ],
      };
    },
    [hasCanvasDesign],
  );

  // ─── Metric Analysis ─────────────────────────────────────

  const handleAnalyzeMetric = useCallback(
    async (metricName: string) => {
      setIsTyping(true);
      try {
        const base = metricName.toLowerCase().includes("cpu")
          ? 45
          : metricName.toLowerCase().includes("mem")
            ? 60
            : 50;
        const recentValues = Array.from({ length: 24 }, (_, i) => {
          const variance = Math.sin(i / 4) * 15;
          return Math.round((base + variance) * 10) / 10;
        });

        const result = await aiopsApi.analyzeMetric({
          metricName,
          recentValues,
          threshold: metricName.toLowerCase().includes("cpu") ? 30 : 35,
        });

        if (result) {
          const msg: Message = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: `## Análise de Métrica: ${result.metricName}\n\n${result.analysis}`,
            suggestions: [
              "Analisar incidentes atuais",
              "Verificar saúde da infraestrutura",
              "Sugerir otimizações",
              ...getDesignSuggestions(),
            ],
          };
          setMessages((prev) => [...prev, msg]);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content:
              "Não foi possível analisar a métrica no momento. Tente novamente mais tarde.",
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [getDesignSuggestions],
  );

  // ─── Suggestion Handler ──────────────────────────────────

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: suggestion,
      };
      setMessages((prev) => [...prev, userMsg]);

      if (suggestion.startsWith("Criar design:")) {
        const templateId = suggestion.includes("VPC")
          ? "vpc-ecs-rds"
          : suggestion.includes("Kubernetes")
            ? "kubernetes-cluster"
            : "serverless-api";
        const response = generateDesignResponse(templateId, suggestion);
        setMessages((prev) => [...prev, response]);
      } else if (suggestion.startsWith("Analisar métricas de CPU")) {
        handleAnalyzeMetric("cpu_utilization");
      } else if (suggestion.startsWith("Analisar métricas de memória")) {
        handleAnalyzeMetric("memory_utilization");
      }
    },
    [generateDesignResponse, handleAnalyzeMetric],
  );

  // ─── Send Handler ────────────────────────────────────────

  const handleSend = useCallback(async () => {
    if (!input.trim()) return;

    const question = input.trim();
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: question,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Check for design intent first
    const designIntent = detectDesignIntent(question);
    if (designIntent) {
      setTimeout(() => {
        const response = generateDesignResponse(designIntent, question);
        setMessages((prev) => [...prev, response]);
        setIsTyping(false);
      }, 800);
      return;
    }

    // Fall back to API with context-aware query
    try {
      const extraContext: Record<string, any> = {
        incidentCount: incidents.length,
      };

      if (hasCanvasDesign) {
        extraContext.canvas = {
          name: canvasName,
          resourceCount: nodes.length,
          connectionCount: edges.length,
          providers,
          nodes: nodes.map((n) => ({
            label: n.data?.label,
            provider: n.data?.provider,
            resourceType: n.data?.resourceType,
          })),
        };
      }

      const data = await aiopsApi.chatQuery({
        question,
        context: String(incidents.length),
        extraContext,
      });

      if (data) {
        const responseMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.answer,
          suggestions: [
            "Analisar incidentes atuais",
            "Sugerir otimizações",
            "Gerar relatório",
            "Analisar métricas de CPU",
            ...getDesignSuggestions(),
          ],
        };

        if (data.design) {
          responseMsg.design = data.design as any;
          responseMsg.designName = (data.design as any)?.name || "Design gerado pela IA";
          responseMsg.isModification = hasCanvasDesign;
        }

        setMessages((prev) => [...prev, responseMsg]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content:
              "Desculpe, não foi possível processar sua solicitação no momento.",
            suggestions: [...getDesignSuggestions()],
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "Erro de conexão com o servidor. Verifique sua conexão e tente novamente.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [
    input,
    generateDesignResponse,
    incidents.length,
    hasCanvasDesign,
    canvasName,
    nodes,
    edges.length,
    providers,
  ]);

  // ─── Canvas Actions ──────────────────────────────────────

  const handleOpenInCanvas = useCallback(
    (design: CanvasDesign) => {
      loadCanvas(design);
      setActiveModule("canvas");
    },
    [loadCanvas, setActiveModule],
  );

  // ─── Incident Actions ────────────────────────────────────

  const handleAnalyzeIncident = async (incident: Incident) => {
    try {
      const updated = await aiopsApi.analyzeIncident(incident.id);
      if (updated) {
        setIncidents((prev) =>
          prev.map((i) => (i.id === incident.id ? updated as unknown as Incident : i)),
        );
        setSelectedIncident(updated as unknown as Incident);
        return;
      }
    } catch {
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `## Análise Indisponível\n\nNão foi possível analisar o incidente **${incident.title}** no momento. O serviço de análise não está respondendo.\n\n> Tente novamente mais tarde ou verifique a conexão com o backend.`,
        suggestions: [
          "Tentar novamente",
          "Resolver incidente",
          "Criar relatório",
          "Monitorar evolução",
        ],
        incidentId: incident.id,
      };
      setMessages((prev) => [...prev, errorMsg]);
      return;
    }
  };

  const autoApplyFix = (incident: Incident, fix: FixSuggestion) => {
    fix.modifications.forEach((mod) => {
      if (mod.property === "label") {
        updateNodeLabel(mod.nodeId, mod.newValue);
      } else {
        updateNodeProperties(mod.nodeId, { [mod.property]: mod.newValue });
      }
    });
    const fixEntry = addFixHistory({
      incidentId: incident.id,
      incidentTitle: incident.title,
      fixDescription: fix.description,
      modifications: fix.modifications,
      deployedAt: null,
      result: "success",
      autoFix: true,
    });
    markResult(fixEntry.id, "success");
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `✅ **Auto-Fix ativado** — Correção automática aplicada ao canvas para "${incident.title}".\n\n${fix.description}\n\nVá para **Provision > Deploy** para implantar as alterações.`,
        suggestions: [
          "Ir para Deploy",
          "Ver histórico de correções",
          "Analisar próximo incidente",
        ],
      },
    ]);
  };

  const handleOpenFixDialog = (
    fix: FixSuggestion,
    incidentId: string,
    incidentTitle: string,
  ) => {
    setPendingFix({
      incidentId,
      incidentTitle,
      fixDescription: fix.description,
      modifications: fix.modifications,
    });
    setFixDialogOpen(true);
  };

  const handleResolveIncident = async (id: string) => {
    try {
      const updated = await aiopsApi.resolveIncident(id);
      if (updated) {
        setIncidents((prev) => prev.map((i) => (i.id === id ? updated as unknown as Incident : i)));
        setSelectedIncident(updated as unknown as Incident);
        return;
      }
    } catch {
      // silent
    }
    setIncidents((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, status: "RESOLVED", resolvedAt: new Date().toISOString() }
          : i,
      ),
    );
    setSelectedIncident((prev) =>
      prev?.id === id
        ? { ...prev, status: "RESOLVED", resolvedAt: new Date().toISOString() }
        : prev,
    );
    clearHighlightedIncidentNodes();
  };

  // ─── Toggle Resource Expansion ───────────────────────────

  const toggleResourceExpansion = useCallback((msgId: string) => {
    setExpandedResources((prev) => {
      const next = new Set(prev);
      if (next.has(msgId)) next.delete(msgId);
      else next.add(msgId);
      return next;
    });
  }, []);

  // ─── Render ──────────────────────────────────────────────

  return (
    <div className="h-full flex bg-white">
      {/* Incident Sidebar */}
      <div className="w-72 border-r border-slate-100 flex flex-col shrink-0">
        <div className="h-16 border-b border-slate-100 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-brand-navy" />
            <h2 className="text-sm font-bold text-brand-navy">Incidentes</h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleAutoFix}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                autoFixEnabled
                  ? "bg-brand-lime/20 text-brand-navy"
                  : "text-slate-400 hover:text-brand-navy hover:bg-slate-100",
              )}
              title={
                autoFixEnabled ? "Auto-Fix ativado" : "Auto-Fix desativado"
              }
            >
              {autoFixEnabled ? (
                <ToggleRight className="w-4 h-4" />
              ) : (
                <ToggleLeft className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={fetchIncidents}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-brand-navy transition-colors"
            >
              <Activity className="w-4 h-4" />
            </button>
          </div>
        </div>
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse space-y-2 p-3 rounded-lg bg-slate-50"
                >
                  <div className="h-3 bg-slate-200 rounded w-3/4" />
                  <div className="h-2 bg-slate-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : incidents.length === 0 ? (
            <div className="p-6 text-center">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-xs text-slate-400">Nenhum incidente ativo</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {incidents.map((inc) => (
                <button
                  key={inc.id}
                  onClick={() => {
                    setSelectedIncident(inc);
                    if (inc.affectedNodeIds && inc.affectedNodeIds.length > 0) {
                      setHighlightedIncidentNodes(inc.affectedNodeIds);
                    }
                  }}
                  className={cn(
                    "w-full text-left p-3 rounded-lg transition-colors",
                    selectedIncident?.id === inc.id
                      ? "bg-brand-navy/5 border border-brand-navy/20"
                      : "hover:bg-slate-50 border border-transparent",
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        severityColor(inc.severity),
                      )}
                    />
                    <span className="text-xs font-bold text-brand-navy truncate">
                      {inc.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full border font-medium",
                        statusColor(inc.status),
                      )}
                    >
                      {inc.status === "OPEN" ? "Aberto" : "Resolvido"}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {severityLabel(inc.severity)}
                    </span>
                  </div>
                  {fixHistory.filter((f) => f.incidentId === inc.id).length >
                    0 && (
                    <div className="mt-1 flex items-center gap-1">
                      <Wrench className="w-3 h-3 text-emerald-500" />
                      <span className="text-[9px] text-emerald-600 font-medium">
                        {
                          fixHistory.filter(
                            (f) =>
                              f.incidentId === inc.id && f.result === "success",
                          ).length
                        }{" "}
                        correção(ões)
                      </span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Main Content Area with Sub-tabs */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-lime/20 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-brand-navy" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-brand-navy font-display">
                Operações com IA
              </h1>
              <p className="text-xs text-slate-400">
                Automação inteligente e gestão de incidentes
              </p>
            </div>
            {hasCanvasDesign && (
              <button
                onClick={() => setActiveModule("canvas")}
                className="ml-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-all"
              >
                <LayoutDashboard className="w-3 h-3" />
                Canvas: {nodes.length} recursos
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {autoFixEnabled && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-brand-lime/20 text-brand-navy border border-brand-lime/30">
                <Zap className="w-3 h-3" />
                Auto-Fix Ativo
              </span>
            )}
            {hasCanvasDesign && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Contexto do Design ativo
              </span>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 border border-green-100">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-bold text-green-700 uppercase tracking-wide">
                IA Online
              </span>
            </div>
          </div>
        </div>

        {/* Sub-tab Bar */}
        <div className="border-b border-slate-100 px-6 shrink-0">
          <div className="flex items-center gap-1">
            {aiopsTabs.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setAiopsTab(tab.id)}
                  className={cn(
                    "relative flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold transition-all border-b-2 -mb-px",
                    aiopsTab === tab.id
                      ? "text-brand-navy border-brand-lime"
                      : "text-slate-500 border-transparent hover:text-brand-navy hover:border-slate-300",
                  )}
                >
                  <TabIcon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Conditional Content based on sub-tab */}
        {aiopsTab === "chat" && (
          <>
            {/* Messages */}
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-4 max-w-4xl mx-auto">
                {/* Selected Incident Detail */}
                {selectedIncident && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "w-2.5 h-2.5 rounded-full",
                            severityColor(selectedIncident.severity),
                          )}
                        />
                        <h3 className="text-sm font-bold text-brand-navy">
                          {selectedIncident.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedIncident(null);
                            clearHighlightedIncidentNodes();
                          }}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600">
                      {selectedIncident.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full border font-medium",
                          statusColor(selectedIncident.status),
                        )}
                      >
                        {selectedIncident.status === "OPEN"
                          ? "Aberto"
                          : "Resolvido"}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 font-medium">
                        {severityLabel(selectedIncident.severity)}
                      </span>
                      {selectedIncident.classification && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                          {selectedIncident.classification}
                        </span>
                      )}
                    </div>
                    {selectedIncident.suggestedRca && (
                      <div className="bg-white rounded-lg p-3 border border-slate-200">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                          Causa Raiz Sugerida
                        </p>
                        <p className="text-xs text-slate-700">
                          {selectedIncident.suggestedRca}
                        </p>
                      </div>
                    )}

                    {/* Fix History for this incident */}
                    <FixHistoryList
                      incident={selectedIncident}
                      fixHistory={fixHistory}
                    />

                    {selectedIncident.status === "OPEN" && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() =>
                            handleAnalyzeIncident(selectedIncident)
                          }
                          className="px-3 py-1.5 bg-brand-navy text-white rounded-lg text-xs font-bold hover:bg-brand-navy/90 transition-colors"
                        >
                          <Search className="w-3 h-3 inline mr-1" />
                          Analisar com IA
                        </button>
                        {selectedIncident.fixSuggestion && (
                          <button
                            onClick={() =>
                              handleOpenFixDialog(
                                selectedIncident.fixSuggestion!,
                                selectedIncident.id,
                                selectedIncident.title,
                              )
                            }
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors"
                          >
                            <Wrench className="w-3 h-3 inline mr-1" />
                            Aplicar Correção
                          </button>
                        )}
                        {selectedIncident.affectedNodeIds &&
                          selectedIncident.affectedNodeIds.length > 0 && (
                            <button
                              onClick={() => {
                                clearHighlightedIncidentNodes();
                                setTimeout(() => {
                                  setHighlightedIncidentNodes(
                                    selectedIncident.affectedNodeIds,
                                  );
                                  setActiveModule("canvas");
                                }, 50);
                              }}
                              className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors"
                            >
                              <Eye className="w-3 h-3 inline mr-1" />
                              Ver no Canvas
                            </button>
                          )}
                        <button
                          onClick={() =>
                            handleResolveIncident(selectedIncident.id)
                          }
                          className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-colors"
                        >
                          <CheckCircle className="w-3 h-3 inline mr-1" />
                          Resolver
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded">
                    Hoje
                  </span>
                </div>

                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex",
                      msg.role === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[75%] text-sm",
                        msg.role === "user"
                          ? "bg-brand-navy text-white rounded-2xl rounded-br-sm p-4 shadow-md"
                          : "bg-white border border-slate-200 rounded-2xl rounded-bl-sm p-5 shadow-sm",
                      )}
                    >
                      {msg.role === "assistant" && (
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-6 h-6 rounded-full bg-brand-lime/20 flex items-center justify-center">
                            <Bot className="w-3.5 h-3.5 text-brand-navy" />
                          </div>
                          <span className="text-xs font-bold text-brand-navy">
                            CloudBuilder AI
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono ml-auto">
                            &lt; 1s
                          </span>
                        </div>
                      )}
                      <p
                        className={cn(
                          msg.role === "user" ? "text-white" : "text-slate-600",
                          "whitespace-pre-wrap",
                        )}
                      >
                        {msg.content}
                      </p>

                      {msg.changes && (
                        <ul className="mt-3 space-y-2">
                          {msg.changes.map((change, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2.5 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100"
                            >
                              <div
                                className={cn(
                                  "w-4 h-4 rounded flex items-center justify-center shrink-0 mt-0.5",
                                  change.color === "text-green-500"
                                    ? "bg-green-50"
                                    : change.color === "text-blue-500"
                                      ? "bg-blue-50"
                                      : "bg-amber-50",
                                )}
                              >
                                {change.icon === "add" ? (
                                  <Plus
                                    className={cn("w-3 h-3", change.color)}
                                  />
                                ) : (
                                  <CheckCircle
                                    className={cn("w-3 h-3", change.color)}
                                  />
                                )}
                              </div>
                              <span>{change.text}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Design Preview Widget */}
                      <DesignPreview
                        msg={msg}
                        expandedResources={expandedResources}
                        onToggleResource={toggleResourceExpansion}
                        onOpenInCanvas={handleOpenInCanvas}
                      />

                      {/* Fix Suggestion Widget */}
                      <FixWidget
                        msg={msg}
                        selectedIncident={selectedIncident}
                        onOpenFixDialog={handleOpenFixDialog}
                      />

                      {msg.suggestions && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {msg.suggestions.map((s) => (
                            <button
                              key={s}
                              onClick={() => handleSuggestionClick(s)}
                              className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                                s.startsWith("Criar design:")
                                  ? "bg-brand-lime/10 hover:bg-brand-lime/20 text-brand-navy border-brand-lime/30"
                                  : s.includes("Aplicar correção") ||
                                      s.includes("Ir para Deploy")
                                    ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-100",
                              )}
                            >
                              {s.startsWith("Criar design:") && (
                                <Sparkles className="w-3 h-3 inline mr-1" />
                              )}
                              {s.includes("Aplicar correção") && (
                                <Wrench className="w-3 h-3 inline mr-1" />
                              )}
                              {s.includes("Ir para Deploy") && (
                                <Rocket className="w-3 h-3 inline mr-1" />
                              )}
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm p-4 shadow-sm flex items-center gap-1.5">
                      <div className="flex items-center gap-1">
                        <div
                          className="w-2 h-2 bg-brand-lime rounded-full animate-bounce"
                          style={{ animationDelay: "0s" }}
                        />
                        <div
                          className="w-2 h-2 bg-brand-lime rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        />
                        <div
                          className="w-2 h-2 bg-brand-lime rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 ml-2">
                        Analisando infraestrutura...
                      </span>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-6 border-t border-slate-100">
              <div className="max-w-4xl mx-auto">
                <div className="relative">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-3 text-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy resize-none h-20 placeholder-slate-400 transition-all"
                    placeholder="Pergunte à IA para criar designs, analisar incidentes, sugerir otimizações..."
                  />
                  <div className="absolute bottom-2 right-2 flex gap-1">
                    <button
                      onClick={handleSend}
                      disabled={!input.trim()}
                      className="p-2 rounded-lg bg-brand-navy text-white hover:bg-brand-navy/90 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Bolt className="w-2.5 h-2.5" /> CloudBuilder LLM v2 —
                      Análise em tempo real
                    </span>
                    <button
                      onClick={toggleAutoFix}
                      className={cn(
                        "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all",
                        autoFixEnabled
                          ? "bg-brand-lime/20 text-brand-navy border border-brand-lime/30"
                          : "bg-slate-100 text-slate-500 border border-slate-200",
                      )}
                    >
                      {autoFixEnabled ? (
                        <ToggleRight className="w-3 h-3" />
                      ) : (
                        <ToggleLeft className="w-3 h-3" />
                      )}
                      Auto-Fix
                    </button>
                  </div>
                  <button
                    onClick={() =>
                      setMessages([
                        {
                          id: crypto.randomUUID(),
                          role: "assistant",
                          content:
                            "Olá! Sou o assistente de operações com IA do CloudBuilder. Como posso ajudar?",
                          suggestions: [
                            ...getDesignSuggestions(),
                            "Analisar incidentes atuais",
                            "Sugerir otimizações de custo",
                            "Verificar saúde da infraestrutura",
                          ],
                        },
                      ])
                    }
                    className="text-[10px] font-bold text-slate-500 hover:text-brand-navy uppercase tracking-wide"
                  >
                    Nova Conversa
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {aiopsTab === "remediation" && (
          <ScrollArea className="flex-1">
            <div className="p-6 max-w-4xl mx-auto">
              <AutoRemediationPanel />
            </div>
          </ScrollArea>
        )}

        {aiopsTab === "runbooks" && (
          <ScrollArea className="flex-1">
            <div className="p-6 max-w-4xl mx-auto">
              <RunbooksPanel />
            </div>
          </ScrollArea>
        )}

        {aiopsTab === "postmortem" && (
          <ScrollArea className="flex-1">
            <div className="p-6 max-w-4xl mx-auto">
              <PostMortemPanel />
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Fix Dialog */}
      {pendingFix && (
        <IncidentFixDialog
          open={fixDialogOpen}
          onOpenChange={setFixDialogOpen}
          incidentId={pendingFix.incidentId}
          incidentTitle={pendingFix.incidentTitle}
          fixDescription={pendingFix.fixDescription}
          modifications={pendingFix.modifications}
        />
      )}
    </div>
  );
}
