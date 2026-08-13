export type PolicySeverity = "critical" | "high" | "medium" | "low";
export type PolicyCategory = "security" | "cost" | "operations" | "compliance";
export type ViolationStatus = "open" | "resolved" | "ignored";

export interface Policy {
  id: string;
  name: string;
  description: string;
  category: PolicyCategory;
  severity: PolicySeverity;
  resourceTypes: string[];
  rule: string;
  autoFixable: boolean;
}

export interface PolicyViolation {
  id: string;
  policyId: string;
  resourceId: string;
  resourceName: string;
  resourceType: string;
  description: string;
  severity: PolicySeverity;
  detectedAt: string;
  status: ViolationStatus;
  autoFixAvailable: boolean;
}

export interface PolicyFix {
  violationId: string;
  description: string;
  changes: Record<string, any>;
}
