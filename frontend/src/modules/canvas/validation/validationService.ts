import type { Node, Edge } from "@xyflow/react";
import type { CanvasNodeData } from "@/types/canvas.types";
import { validateCanvas } from "@/api/design";

export interface ValidationIssue {
  ruleName: string;
  severity: "ERROR" | "WARNING" | "INFO";
  message: string;
  componentId?: string;
}

export interface ValidationReport {
  canvasId: string;
  status: "VALID" | "INVALID" | "WARNING";
  issues: ValidationIssue[];
  validatedAt: string;
}

export async function validateCanvasOnBackend(
  canvasId: string,
): Promise<ValidationReport> {
  return validateCanvas(canvasId) as unknown as ValidationReport;
}

export function validateLocal(
  nodes: Node<CanvasNodeData>[],
  edges: Edge[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const node of nodes) {
    const { resourceType, properties, label } = node.data;

    if (resourceType === "aws_instance" && !properties?.instance_type) {
      issues.push({
        ruleName: "required-property",
        severity: "ERROR",
        message: `aws_instance "${label}" requires 'instance_type' property`,
        componentId: node.id,
      });
    }

    if (resourceType === "aws_db_instance" && !properties?.engine) {
      issues.push({
        ruleName: "required-property",
        severity: "ERROR",
        message: `aws_db_instance "${label}" requires 'engine' property`,
        componentId: node.id,
      });
    }

    if (
      resourceType === "aws_s3_bucket" &&
      !properties?.bucket &&
      !properties?.name
    ) {
      issues.push({
        ruleName: "required-property",
        severity: "WARNING",
        message: `aws_s3_bucket "${label}" should have a 'bucket' or 'name' property`,
        componentId: node.id,
      });
    }
  }

  for (const edge of edges) {
    if (edge.source === edge.target) {
      const node = nodes.find((n) => n.id === edge.source);
      issues.push({
        ruleName: "self-connection",
        severity: "ERROR",
        message: `Node "${node?.data?.label ?? edge.source}" has a self-connected edge`,
        componentId: edge.source,
      });
    }
  }

  return issues;
}

export function getNodeValidationStatus(
  issues: ValidationIssue[],
  nodeId: string,
): "VALID" | "WARNING" | "INVALID" | "PENDING" {
  const nodeIssues = issues.filter((i) => i.componentId === nodeId);
  if (nodeIssues.length === 0) return "VALID";
  if (nodeIssues.some((i) => i.severity === "ERROR")) return "INVALID";
  if (nodeIssues.some((i) => i.severity === "WARNING")) return "WARNING";
  return "VALID";
}
