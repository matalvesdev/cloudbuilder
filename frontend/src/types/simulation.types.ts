// ── Simulation Engine Types (ADR-039) ──────────────────────────────

export type ScenarioType =
  | "traffic_spike"
  | "component_failure"
  | "latency_injection"
  | "bug_regression";

export interface ScenarioParams {
  /** Multiplicador de tráfego (ex: 5 = 5x) */
  trafficMultiplier?: number;
  /** ID do componente que falha (component_failure) */
  failedComponentId?: string;
  /** ms extras de latência (latency_injection) */
  extraLatencyMs?: number;
  /** % de erros a injetar (bug_regression) */
  errorRate?: number;
}

export interface ScenarioDefinition {
  type: ScenarioType;
  label: string;
  description: string;
  icon: string;
  defaultParams: ScenarioParams;
}

export interface GoldenSignals {
  /** Latência média em ms */
  latencyMs: number;
  /** Throughput em requests/segundo */
  trafficTps: number;
  /** Taxa de erro em % */
  errorRate: number;
  /** Saturação de CPU em % */
  cpuSaturation: number;
  /** Saturação de memória em % */
  memorySaturation: number;
}

export interface PerformanceProfile {
  resourceType: string;
  provider: string;
  displayName: string;
  latencyMs: number;
  maxTps: number;
  vCpu: number;
  memoryGb: number;
  maxConnections: number;
  /** Notas sobre comportamento (cold start, burst, etc.) */
  notes?: string;
  /** true se o recurso escala horizontalmente */
  scalesHorizontally: boolean;
  /** true se tem cold start */
  hasColdStart?: boolean;
  /** ms adicionais se cold start */
  coldStartPenaltyMs?: number;
}

export type ResourceStatus = "healthy" | "degraded" | "critical" | "down";

export interface ResourceSignal {
  nodeId: string;
  label: string;
  resourceType: string;
  provider: string;
  profile: PerformanceProfile;
  baseline: GoldenSignals;
  simulated: GoldenSignals;
  status: ResourceStatus;
  /** Mudança percentual em latency */
  latencyDeltaPct: number;
  /** Mudança percentual em TPS */
  trafficDeltaPct: number;
  /** Mudança percentual em erro */
  errorDeltaPct: number;
  /** Mudança percentual em saturação CPU */
  cpuDeltaPct: number;
}

export interface SimulationInput {
  nodes: Array<{
    id: string;
    label: string;
    provider: string;
    resourceType: string;
    properties: Record<string, any>;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
  }>;
  scenarioType: ScenarioType;
  scenarioParams: ScenarioParams;
}

export interface SimulationResult {
  input: SimulationInput;
  scenarioType: ScenarioType;
  scenarioParams: ScenarioParams;
  baselineTotal: GoldenSignals;
  simulatedTotal: GoldenSignals;
  resources: ResourceSignal[];
  aggregatedStatus: ResourceStatus;
  /** Número de recursos com degradação crítica */
  criticalCount: number;
  /** Número de recursos degradados */
  degradedCount: number;
  /** Número de recursos saudáveis */
  healthyCount: number;
  /** Timestamp da simulação */
  timestamp: string;
}

export const SCENARIO_DEFINITIONS: Record<ScenarioType, ScenarioDefinition> = {
  traffic_spike: {
    type: "traffic_spike",
    label: "Pico de Tráfego",
    description: "Simula um aumento súbito no volume de requisições",
    icon: "TrendingUp",
    defaultParams: { trafficMultiplier: 5 },
  },
  component_failure: {
    type: "component_failure",
    label: "Falha de Componente",
    description: "Simula a indisponibilidade de um recurso específico",
    icon: "Unplug",
    defaultParams: { failedComponentId: "" },
  },
  latency_injection: {
    type: "latency_injection",
    label: "Injeção de Latência",
    description: "Adiciona latência extra nas conexões entre recursos",
    icon: "Timer",
    defaultParams: { extraLatencyMs: 200 },
  },
  bug_regression: {
    type: "bug_regression",
    label: "Regression de Bug",
    description: "Simula um aumento na taxa de erros do sistema",
    icon: "Bug",
    defaultParams: { errorRate: 15 },
  },
};

export const PERFORMANCE_PROFILES: PerformanceProfile[] = [
  {
    resourceType: "aws_instance",
    provider: "aws",
    displayName: "EC2 t3.medium",
    latencyMs: 50,
    maxTps: 100,
    vCpu: 2,
    memoryGb: 4,
    maxConnections: 30,
    notes: "Burstable CPU (credits)",
    scalesHorizontally: true,
  },
  {
    resourceType: "aws_instance",
    provider: "aws",
    displayName: "EC2 m5.large",
    latencyMs: 30,
    maxTps: 500,
    vCpu: 2,
    memoryGb: 8,
    maxConnections: 50,
    notes: "Compute optimized",
    scalesHorizontally: true,
  },
  {
    resourceType: "aws_db_instance",
    provider: "aws",
    displayName: "RDS t3.small",
    latencyMs: 5,
    maxTps: 200,
    vCpu: 2,
    memoryGb: 2,
    maxConnections: 100,
    notes: "Burstable",
    scalesHorizontally: false,
  },
  {
    resourceType: "aws_db_instance",
    provider: "aws",
    displayName: "RDS r5.large",
    latencyMs: 2,
    maxTps: 2000,
    vCpu: 2,
    memoryGb: 16,
    maxConnections: 600,
    notes: "Memory optimized",
    scalesHorizontally: false,
  },
  {
    resourceType: "aws_s3_bucket",
    provider: "aws",
    displayName: "S3 Bucket",
    latencyMs: 50,
    maxTps: 5500,
    vCpu: 9999,
    memoryGb: 9999,
    maxConnections: 99999,
    notes: "Escala horizontal ilimitada",
    scalesHorizontally: true,
  },
  {
    resourceType: "aws_lambda_function",
    provider: "aws",
    displayName: "Lambda Function",
    latencyMs: 100,
    maxTps: 1000,
    vCpu: 1,
    memoryGb: 0.5,
    maxConnections: 1000,
    notes: "Cold start adiciona ~500ms",
    scalesHorizontally: true,
    hasColdStart: true,
    coldStartPenaltyMs: 500,
  },
  {
    resourceType: "aws_ecs_service",
    provider: "aws",
    displayName: "ECS Service (por task)",
    latencyMs: 10,
    maxTps: 500,
    vCpu: 1,
    memoryGb: 2,
    maxConnections: 250,
    scalesHorizontally: true,
  },
  {
    resourceType: "aws_api_gateway",
    provider: "aws",
    displayName: "API Gateway",
    latencyMs: 50,
    maxTps: 10000,
    vCpu: 9999,
    memoryGb: 9999,
    maxConnections: 99999,
    notes: "Throttle no limite",
    scalesHorizontally: true,
  },
  {
    resourceType: "aws_sqs_queue",
    provider: "aws",
    displayName: "SQS Queue (Standard)",
    latencyMs: 25,
    maxTps: 300,
    vCpu: 9999,
    memoryGb: 9999,
    maxConnections: 99999,
    notes: "Mensagens em fila",
    scalesHorizontally: true,
  },
  {
    resourceType: "aws_elasticache",
    provider: "aws",
    displayName: "ElastiCache Redis",
    latencyMs: 1,
    maxTps: 25000,
    vCpu: 2,
    memoryGb: 13,
    maxConnections: 65000,
    notes: "In-memory",
    scalesHorizontally: false,
  },
  {
    resourceType: "azurerm_linux_virtual_machine",
    provider: "azure",
    displayName: "VM Linux (Standard_B2s)",
    latencyMs: 50,
    maxTps: 200,
    vCpu: 2,
    memoryGb: 4,
    maxConnections: 30,
    scalesHorizontally: true,
  },
  {
    resourceType: "azurerm_mssql_database",
    provider: "azure",
    displayName: "SQL Database (S2)",
    latencyMs: 5,
    maxTps: 500,
    vCpu: 2,
    memoryGb: 5,
    maxConnections: 100,
    notes: "DTU-based",
    scalesHorizontally: false,
  },
  {
    resourceType: "google_compute_instance",
    provider: "gcp",
    displayName: "GCE e2-standard-2",
    latencyMs: 50,
    maxTps: 200,
    vCpu: 2,
    memoryGb: 4,
    maxConnections: 30,
    scalesHorizontally: true,
  },
  {
    resourceType: "google_cloud_run_service",
    provider: "gcp",
    displayName: "Cloud Run (per container)",
    latencyMs: 100,
    maxTps: 1000,
    vCpu: 1,
    memoryGb: 2,
    maxConnections: 250,
    notes: "Auto-scale",
    scalesHorizontally: true,
  },
  {
    resourceType: "kubernetes_deployment",
    provider: "k8s",
    displayName: "K8s Deployment (per pod)",
    latencyMs: 10,
    maxTps: 500,
    vCpu: 1,
    memoryGb: 2,
    maxConnections: 250,
    notes: "Escala com HPA",
    scalesHorizontally: true,
  },
];

/** Encontra o perfil correspondente ao resourceType + provider. Fallback para genérico. */
export function findProfile(
  provider: string,
  resourceType: string,
): PerformanceProfile | undefined {
  return PERFORMANCE_PROFILES.find(
    (p) => p.provider === provider && p.resourceType === resourceType,
  );
}

/** Computa status baseado nos golden signals simulados vs o perfil */
export function computeResourceStatus(
  signal: GoldenSignals,
  profile: PerformanceProfile,
): ResourceStatus {
  const cpuRatio = signal.cpuSaturation / 100;
  const memRatio = signal.memorySaturation / 100;
  const tpsRatio = signal.trafficTps / profile.maxTps;
  // Down se excede capacidade ou 0 TPS
  if (signal.trafficTps === 0 || signal.errorRate >= 100) return "down";
  // Critical se saturação > 90% ou error > 10%
  if (cpuRatio > 0.9 || memRatio > 0.9 || signal.errorRate > 10 || tpsRatio > 1)
    return "critical";
  // Degraded se saturação > 70% ou error > 5% ou perto do limite
  if (
    cpuRatio > 0.7 ||
    memRatio > 0.7 ||
    signal.errorRate > 5 ||
    tpsRatio > 0.8
  )
    return "degraded";
  return "healthy";
}
