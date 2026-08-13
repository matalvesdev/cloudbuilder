import type { CanvasDesign } from "@/types/canvas.types";
import type { ResourceModification } from "@/store/incidentStore";

export interface FixSuggestion {
  description: string;
  modifications: ResourceModification[];
}

export interface Incident {
  id: string;
  environmentId: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  classification: string | null;
  suggestedRca: string | null;
  fixSuggestion: FixSuggestion | null;
  incidentType: string;
  detectedAt: string;
  resolvedAt: string | null;
  affectedNodeIds: string[];
}

export interface DesignChange {
  action: "add" | "modify" | "remove";
  resource: string;
  description: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
  changes?: { icon: string; text: string; color: string }[];
  design?: CanvasDesign | null;
  designName?: string;
  isModification?: boolean;
  designChanges?: DesignChange[];
  fixSuggestion?: FixSuggestion | null;
  incidentId?: string;
}
