// ── Simulation Engine — 8-Step Algorithm (ADR-039) ──────────────────
// MVP: 100% client-side, deterministic computation.
// V2: migra para backend API com persistência.
// V3: adiciona distribuições probabilísticas (Monte Carlo).

import type {
  SimulationInput,
  SimulationResult,
  GoldenSignals,
  ResourceSignal,
  PerformanceProfile,
  ResourceStatus,
} from "@/types/simulation.types";
import { findProfile, computeResourceStatus } from "@/types/simulation.types";

// ── Helpers ────────────────────────────────────────────────────────

function defaultGolden(): GoldenSignals {
  return {
    latencyMs: 0,
    trafficTps: 0,
    errorRate: 0,
    cpuSaturation: 0,
    memorySaturation: 0,
  };
}

function cloneGolden(g: GoldenSignals): GoldenSignals {
  return { ...g };
}

// ── Step 1: Parse ──────────────────────────────────────────────────
// Extrai nodes + edges + properties do canvas input.

function stepParse(input: SimulationInput) {
  return input;
}

// ── Step 2: Profile ────────────────────────────────────────────────
// Para cada node, faz lookup do PerformanceProfile.

function stepProfile(input: SimulationInput): Map<string, PerformanceProfile> {
  const profileMap = new Map<string, PerformanceProfile>();
  for (const node of input.nodes) {
    const profile = findProfile(node.provider, node.resourceType);
    if (profile) {
      profileMap.set(node.id, profile);
    } else {
      // Fallback genérico
      profileMap.set(node.id, {
        resourceType: node.resourceType,
        provider: node.provider,
        displayName: node.label || node.resourceType,
        latencyMs: 100,
        maxTps: 100,
        vCpu: 1,
        memoryGb: 2,
        maxConnections: 50,
        scalesHorizontally: true,
      });
    }
  }
  return profileMap;
}

// ── Step 3: Baseline ────────────────────────────────────────────────
// Computa golden signals sem modificações (cenário "normal").

function stepBaseline(
  nodes: SimulationInput["nodes"],
  profileMap: Map<string, PerformanceProfile>,
): Map<string, GoldenSignals> {
  const baselines = new Map<string, GoldenSignals>();
  for (const node of nodes) {
    const profile = profileMap.get(node.id);
    if (!profile) continue;

    const instanceCount =
      node.properties?.instance_count ?? node.properties?.instanceCount ?? 1;
    // Baseline: perto do idle — 10-30% da capacidade máxima
    const utilization = 0.2; // 20% em cenário normal
    const coldStartMs = profile.hasColdStart ? 0 : 0; // sem cold start em baseline

    baselines.set(node.id, {
      latencyMs: profile.latencyMs + coldStartMs,
      trafficTps: Math.round(
        profile.maxTps *
          utilization *
          (profile.scalesHorizontally ? instanceCount : 1),
      ),
      errorRate: 0.5, // 0.5% baseline
      cpuSaturation: Math.round(utilization * 100),
      memorySaturation: Math.round(utilization * 100),
    });
  }
  return baselines;
}

// ── Step 4: Apply ──────────────────────────────────────────────────
// Aplica modificações do cenário escolhido.

interface AppliedModifiers {
  /** Multiplicador de tráfego */
  trafficMultiplier: number;
  /** ID do componente que falhou (ou null) */
  failedComponentId: string | null;
  /** ms extras de latência */
  extraLatencyMs: number;
  /** % de erro extra */
  extraErrorRate: number;
}

function stepApply(
  input: SimulationInput,
  profileMap: Map<string, PerformanceProfile>,
): AppliedModifiers {
  const { scenarioType, scenarioParams } = input;

  const modifiers: AppliedModifiers = {
    trafficMultiplier: 1,
    failedComponentId: null,
    extraLatencyMs: 0,
    extraErrorRate: 0,
  };

  switch (scenarioType) {
    case "traffic_spike":
      modifiers.trafficMultiplier = scenarioParams.trafficMultiplier ?? 5;
      break;
    case "component_failure":
      modifiers.failedComponentId = scenarioParams.failedComponentId ?? null;
      break;
    case "latency_injection":
      modifiers.extraLatencyMs = scenarioParams.extraLatencyMs ?? 200;
      break;
    case "bug_regression":
      modifiers.extraErrorRate = (scenarioParams.errorRate ?? 15) / 100;
      break;
  }

  return modifiers;
}

// ── Step 5: Compute ────────────────────────────────────────────────
// Recalcula 4 sinais após modificações.

function stepCompute(
  nodeId: string,
  node: SimulationInput["nodes"][0],
  baseline: GoldenSignals,
  profile: PerformanceProfile,
  modifiers: AppliedModifiers,
  isFailed: boolean,
  downstreamMultiplier: number,
): GoldenSignals {
  if (isFailed) {
    return {
      latencyMs: 0,
      trafficTps: 0,
      errorRate: 100,
      cpuSaturation: 0,
      memorySaturation: 0,
    };
  }

  const instanceCount =
    node.properties?.instance_count ?? node.properties?.instanceCount ?? 1;

  // Aplica multiplicador de tráfego
  const adjustedTraffic =
    baseline.trafficTps * modifiers.trafficMultiplier * downstreamMultiplier;
  const tpsPerInstance =
    instanceCount > 1 ? adjustedTraffic / instanceCount : adjustedTraffic;

  // Computa saturação de CPU baseada na relação TPS / maxTps
  const cpuRatio = Math.min(1, tpsPerInstance / profile.maxTps);
  // Memória escala mais lentamente
  const memRatio = Math.min(1, cpuRatio * 0.7 + 0.15);

  // Latência aumenta com saturação (modelo M/M/1 simplificado)
  const latencyMultiplier =
    cpuRatio > 0.7
      ? 1 + (cpuRatio - 0.7) * 5 // crescimento exponencial após 70%
      : 1;
  let latencyMs =
    baseline.latencyMs * latencyMultiplier + modifiers.extraLatencyMs;

  // Cold start adiciona latência em cenários de stress
  if (profile.hasColdStart && modifiers.trafficMultiplier > 2) {
    latencyMs += (profile.coldStartPenaltyMs ?? 500) * 0.3; // 30% chance de cold start
  }

  // Taxa de erro aumenta com saturação + bug regression
  const baseErrorRate = baseline.errorRate;
  const saturationError = cpuRatio > 0.9 ? 0.1 : cpuRatio > 0.8 ? 0.03 : 0;
  const errorRate = baseErrorRate + saturationError + modifiers.extraErrorRate;

  const cpuSaturation = Math.round(cpuRatio * 100);
  const memorySaturation = Math.round(Math.min(100, memRatio * 100));

  return {
    latencyMs: Math.round(latencyMs),
    trafficTps: Math.round(adjustedTraffic),
    errorRate: Math.round(errorRate * 10) / 10,
    cpuSaturation,
    memorySaturation,
  };
}

// ── Step 6: Propagate ──────────────────────────────────────────────
// Propaga impacto através das edges (dependências).

interface PropagationResult {
  signals: Map<string, GoldenSignals>;
  failedNodes: Set<string>;
}

function stepPropagate(
  input: SimulationInput,
  profileMap: Map<string, PerformanceProfile>,
  baselines: Map<string, GoldenSignals>,
  modifiers: AppliedModifiers,
): PropagationResult {
  const signals = new Map<string, GoldenSignals>();
  const failedNodes = new Set<string>();

  // Identifica dependências: source → target
  const dependencies = new Map<string, string[]>();
  const reverseDeps = new Map<string, string[]>(); // target → [sources]
  for (const edge of input.edges) {
    if (!dependencies.has(edge.source)) dependencies.set(edge.source, []);
    dependencies.get(edge.source)!.push(edge.target);
    if (!reverseDeps.has(edge.target)) reverseDeps.set(edge.target, []);
    reverseDeps.get(edge.target)!.push(edge.source);
  }

  // Ordem topológica: processar sources primeiro
  const processed = new Set<string>();
  const inProgress = new Set<string>();

  function computeNode(nodeId: string): GoldenSignals {
    // Já processado ou falhou
    if (signals.has(nodeId)) return signals.get(nodeId)!;
    if (failedNodes.has(nodeId)) {
      return {
        latencyMs: 0,
        trafficTps: 0,
        errorRate: 100,
        cpuSaturation: 0,
        memorySaturation: 0,
      };
    }

    // Detecção de ciclo
    if (inProgress.has(nodeId)) {
      // Ciclo: usar baseline
      const base = baselines.get(nodeId) ?? defaultGolden();
      return cloneGolden(base);
    }
    inProgress.add(nodeId);

    const node = input.nodes.find((n) => n.id === nodeId);
    const profile = profileMap.get(nodeId);

    if (!node || !profile) {
      inProgress.delete(nodeId);
      processed.add(nodeId);
      const base = baselines.get(nodeId) ?? defaultGolden();
      signals.set(nodeId, base);
      return cloneGolden(base);
    }

    const isFailed = modifiers.failedComponentId === nodeId;

    // Computa downstream multiplier: se sources estão saturados, reduz throughput
    const upstreamNodes = reverseDeps.get(nodeId) ?? [];
    let downstreamMultiplier = 1;
    for (const upstreamId of upstreamNodes) {
      const upstreamSignal = computeNode(upstreamId);
      if (upstreamSignal.errorRate > 50 || upstreamSignal.trafficTps === 0) {
        // Upstream falhou — este node perde throughput
        downstreamMultiplier = Math.max(0, downstreamMultiplier - 0.4);
      } else if (upstreamSignal.cpuSaturation > 90) {
        downstreamMultiplier = Math.max(0, downstreamMultiplier - 0.15);
      }
    }

    const baseline = baselines.get(nodeId) ?? defaultGolden();
    const computed = stepCompute(
      nodeId,
      node,
      baseline,
      profile,
      modifiers,
      isFailed,
      downstreamMultiplier,
    );

    if (isFailed) failedNodes.add(nodeId);
    if (computed.trafficTps === 0 || computed.errorRate >= 100) {
      failedNodes.add(nodeId);
    }

    inProgress.delete(nodeId);
    processed.add(nodeId);
    signals.set(nodeId, computed);
    return cloneGolden(computed);
  }

  // Processa todos os nodes
  for (const node of input.nodes) {
    if (!processed.has(node.id) && !signals.has(node.id)) {
      computeNode(node.id);
    }
  }

  return { signals, failedNodes };
}

// ── Step 7: Aggregate ──────────────────────────────────────────────
// Sumariza por node e total.

function stepAggregate(
  input: SimulationInput,
  profileMap: Map<string, PerformanceProfile>,
  baselines: Map<string, GoldenSignals>,
  computed: PropagationResult,
): {
  resources: ResourceSignal[];
  totalBaseline: GoldenSignals;
  totalSimulated: GoldenSignals;
  criticalCount: number;
  degradedCount: number;
  healthyCount: number;
  aggregatedStatus: ResourceStatus;
} {
  const resources: ResourceSignal[] = [];
  const totalBaseline = defaultGolden();
  const totalSimulated = defaultGolden();
  let criticalCount = 0;
  let degradedCount = 0;
  let healthyCount = 0;

  for (const node of input.nodes) {
    const profile = profileMap.get(node.id);
    if (!profile) continue;

    const baseline = baselines.get(node.id) ?? defaultGolden();
    const simulated = computed.signals.get(node.id) ?? baseline;
    const status = computeResourceStatus(simulated, profile);

    const latencyDeltaPct =
      baseline.latencyMs > 0
        ? Math.round(
            ((simulated.latencyMs - baseline.latencyMs) / baseline.latencyMs) *
              100,
          )
        : 0;
    const trafficDeltaPct =
      baseline.trafficTps > 0
        ? Math.round(
            ((simulated.trafficTps - baseline.trafficTps) /
              baseline.trafficTps) *
              100,
          )
        : 0;
    const errorDeltaPct =
      baseline.errorRate > 0
        ? Math.round(
            ((simulated.errorRate - baseline.errorRate) / baseline.errorRate) *
              100,
          )
        : 0;
    const cpuDeltaPct =
      baseline.cpuSaturation > 0
        ? Math.round(
            ((simulated.cpuSaturation - baseline.cpuSaturation) /
              baseline.cpuSaturation) *
              100,
          )
        : 0;

    resources.push({
      nodeId: node.id,
      label: node.label || node.resourceType,
      resourceType: node.resourceType,
      provider: node.provider,
      profile,
      baseline: cloneGolden(baseline),
      simulated: cloneGolden(simulated),
      status,
      latencyDeltaPct,
      trafficDeltaPct,
      errorDeltaPct,
      cpuDeltaPct,
    });

    // Acumula totais (média ponderada por TPS)
    totalBaseline.latencyMs += baseline.latencyMs * baseline.trafficTps;
    totalBaseline.trafficTps += baseline.trafficTps;
    totalBaseline.errorRate += baseline.errorRate;
    totalBaseline.cpuSaturation += baseline.cpuSaturation;
    totalBaseline.memorySaturation += baseline.memorySaturation;

    totalSimulated.latencyMs += simulated.latencyMs * simulated.trafficTps;
    totalSimulated.trafficTps += simulated.trafficTps;
    totalSimulated.errorRate += simulated.errorRate;
    totalSimulated.cpuSaturation += simulated.cpuSaturation;
    totalSimulated.memorySaturation += simulated.memorySaturation;

    if (status === "critical") criticalCount++;
    else if (status === "degraded") degradedCount++;
    else healthyCount++;
  }

  // Normaliza totais (média ponderada)
  if (totalBaseline.trafficTps > 0) {
    totalBaseline.latencyMs = Math.round(
      totalBaseline.latencyMs / (input.nodes.length || 1),
    );
    totalBaseline.cpuSaturation = Math.round(
      totalBaseline.cpuSaturation / (input.nodes.length || 1),
    );
    totalBaseline.memorySaturation = Math.round(
      totalBaseline.memorySaturation / (input.nodes.length || 1),
    );
    totalBaseline.errorRate =
      Math.round((totalBaseline.errorRate / (input.nodes.length || 1)) * 10) /
      10;
  }
  if (totalSimulated.trafficTps > 0) {
    totalSimulated.latencyMs = Math.round(
      totalSimulated.latencyMs / (input.nodes.length || 1),
    );
    totalSimulated.cpuSaturation = Math.round(
      totalSimulated.cpuSaturation / (input.nodes.length || 1),
    );
    totalSimulated.memorySaturation = Math.round(
      totalSimulated.memorySaturation / (input.nodes.length || 1),
    );
    totalSimulated.errorRate =
      Math.round((totalSimulated.errorRate / (input.nodes.length || 1)) * 10) /
      10;
  }

  const aggregatedStatus: ResourceStatus =
    criticalCount > 0 ? "critical" : degradedCount > 0 ? "degraded" : "healthy";

  return {
    resources,
    totalBaseline,
    totalSimulated,
    criticalCount,
    degradedCount,
    healthyCount,
    aggregatedStatus,
  };
}

// ── Step 8: Return ──────────────────────────────────────────────────
// Monta SimulationResult final.

function stepReturn(
  input: SimulationInput,
  totalBaseline: GoldenSignals,
  totalSimulated: GoldenSignals,
  resources: ResourceSignal[],
  criticalCount: number,
  degradedCount: number,
  healthyCount: number,
  aggregatedStatus: ResourceStatus,
): SimulationResult {
  return {
    input,
    scenarioType: input.scenarioType,
    scenarioParams: input.scenarioParams,
    baselineTotal: totalBaseline,
    simulatedTotal: totalSimulated,
    resources,
    aggregatedStatus,
    criticalCount,
    degradedCount,
    healthyCount,
    timestamp: new Date().toISOString(),
  };
}

// ── Public API ─────────────────────────────────────────────────────

/**
 * Executa o pipeline completo de simulação (8 etapas).
 * MVP 100% client-side — roda in-process sem dependências externas.
 */
export function runSimulation(input: SimulationInput): SimulationResult {
  // Step 1: Parse
  const parsed = stepParse(input);

  // Step 2: Profile
  const profileMap = stepProfile(parsed);

  // Step 3: Baseline
  const baselines = stepBaseline(parsed.nodes, profileMap);

  // Step 4: Apply
  const modifiers = stepApply(parsed, profileMap);

  // Step 5+6: Compute + Propagate (integrados para propagação topológica)
  const computed = stepPropagate(parsed, profileMap, baselines, modifiers);

  // Step 7: Aggregate
  const {
    resources,
    totalBaseline,
    totalSimulated,
    criticalCount,
    degradedCount,
    healthyCount,
    aggregatedStatus,
  } = stepAggregate(parsed, profileMap, baselines, computed);

  // Step 8: Return
  return stepReturn(
    parsed,
    totalBaseline,
    totalSimulated,
    resources,
    criticalCount,
    degradedCount,
    healthyCount,
    aggregatedStatus,
  );
}

export type { AppliedModifiers, PropagationResult };
