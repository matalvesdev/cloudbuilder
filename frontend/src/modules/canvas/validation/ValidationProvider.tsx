import {
  createContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { useCanvasStore } from "@/store/canvasStore";
import type { Node, Edge } from "@xyflow/react";
import type { CanvasNodeData } from "@/types/canvas.types";
import {
  validateLocal,
  validateCanvasOnBackend,
  type ValidationIssue,
} from "./validationService";

interface ValidationContextValue {
  issues: ValidationIssue[];
  errorCount: number;
  warningCount: number;
  infoCount: number;
  runValidation: () => void;
  runBackendValidation: () => Promise<void>;
  overallStatus: "VALID" | "WARNINGS" | "INVALID" | "PENDING";
}

export const ValidationContext = createContext<ValidationContextValue | null>(
  null,
);

interface ValidationProviderProps {
  children: ReactNode;
}

export function ValidationProvider({ children }: ValidationProviderProps) {
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const canvasId = useCanvasStore((s) => s.canvasId);
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [backendPending, setBackendPending] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runValidation = useCallback(() => {
    const localIssues = validateLocal(nodes, edges);
    setIssues(localIssues);
  }, [nodes, edges]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runValidation();
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [nodes, edges, runValidation]);

  const runBackendValidation = useCallback(async () => {
    if (!canvasId) {
      runValidation();
      return;
    }
    setBackendPending(true);
    try {
      const report = await validateCanvasOnBackend(canvasId);
      setIssues(report.issues);
    } catch {
      runValidation();
    } finally {
      setBackendPending(false);
    }
  }, [canvasId, runValidation]);

  const errorCount = issues.filter((i) => i.severity === "ERROR").length;
  const warningCount = issues.filter((i) => i.severity === "WARNING").length;
  const infoCount = issues.filter((i) => i.severity === "INFO").length;

  let overallStatus: ValidationContextValue["overallStatus"] = "VALID";
  if (errorCount > 0) overallStatus = "INVALID";
  else if (warningCount > 0) overallStatus = "WARNINGS";
  else if (backendPending) overallStatus = "PENDING";

  return (
    <ValidationContext.Provider
      value={{
        issues,
        errorCount,
        warningCount,
        infoCount,
        runValidation,
        runBackendValidation,
        overallStatus,
      }}
    >
      {children}
    </ValidationContext.Provider>
  );
}
