// ── Simulation Engine Zustand Store ───────────────────────────────
// Gerencia estado da simulação: cenário ativo, parâmetros, resultados.
// Consome canvas nodes/edges do canvasStore e executa o engine.

import { create } from "zustand";
import type { Node, Edge } from "@xyflow/react";
import type {
  ScenarioType,
  ScenarioParams,
  SimulationResult,
  ResourceSignal,
  GoldenSignals,
} from "@/types/simulation.types";
import { SCENARIO_DEFINITIONS } from "@/types/simulation.types";
import { runSimulation } from "@/services/simulationEngine";
import type { CanvasNodeData } from "@/types/canvas.types";

// ── State ──────────────────────────────────────────────────────────

interface SimulationState {
  // Scenario
  activeScenario: ScenarioType;
  scenarioParams: ScenarioParams;

  // Results
  result: SimulationResult | null;
  isRunning: boolean;
  isVisible: boolean;
  lastRunAt: string | null;

  // Actions
  setScenario: (type: ScenarioType, params?: ScenarioParams) => void;
  setScenarioParam: (key: keyof ScenarioParams, value: number | string) => void;
  runSimulationOnCanvas: (nodes: Node<CanvasNodeData>[], edges: Edge[]) => void;
  toggleVisibility: () => void;
  setVisible: (visible: boolean) => void;
  clearResults: () => void;
}

// ── Default params per scenario ────────────────────────────────────

const defaultParamsFor = (type: ScenarioType): ScenarioParams => ({
  ...SCENARIO_DEFINITIONS[type]?.defaultParams,
});

// ── Store ──────────────────────────────────────────────────────────

export const useSimulationStore = create<SimulationState>((set, get) => ({
  // Initial state
  activeScenario: "traffic_spike",
  scenarioParams: defaultParamsFor("traffic_spike"),
  result: null,
  isRunning: false,
  isVisible: false,
  lastRunAt: null,

  // ── Actions ──

  setScenario: (type, params) => {
    set({
      activeScenario: type,
      scenarioParams: params ?? defaultParamsFor(type),
    });
  },

  setScenarioParam: (key, value) => {
    set((state) => ({
      scenarioParams: { ...state.scenarioParams, [key]: value },
    }));
  },

  runSimulationOnCanvas: (nodes, edges) => {
    set({ isRunning: true });

    // Pequeno delay para feedback visual de loading (em produção seria assíncrono)
    setTimeout(() => {
      const { activeScenario, scenarioParams } = get();

      // Converte canvas nodes/edges para SimulationInput
      const input = {
        nodes: nodes.map((n) => ({
          id: n.id,
          label: n.data?.label || n.data?.resourceType || "unknown",
          provider: n.data?.provider || "aws",
          resourceType: n.data?.resourceType || "aws_instance",
          properties: n.data?.properties || {},
        })),
        edges: edges.map((e) => ({
          id: e.id || `${e.source}->${e.target}`,
          source: e.source,
          target: e.target,
        })),
        scenarioType: activeScenario,
        scenarioParams: scenarioParams,
      };

      // Executa engine
      const result = runSimulation(input);

      set({
        result,
        isRunning: false,
        lastRunAt: new Date().toISOString(),
      });
    }, 100); // 100ms delay para feedback visual
  },

  toggleVisibility: () => {
    set((state) => ({ isVisible: !state.isVisible }));
  },

  setVisible: (visible) => {
    set({ isVisible: visible });
  },

  clearResults: () => {
    set({
      result: null,
      lastRunAt: null,
    });
  },
}));
