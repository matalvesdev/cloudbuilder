export type ActivityType =
  | "design_save"
  | "design_validate"
  | "design_import"
  | "deploy_start"
  | "deploy_success"
  | "deploy_fail"
  | "deploy_promote"
  | "drift_detected"
  | "drift_remediated"
  | "drift_accepted"
  | "cost_anomaly"
  | "cost_optimization"
  | "cost_saving"
  | "compliance_violation"
  | "compliance_fixed"
  | "compliance_ok"
  | "approval_requested"
  | "approval_approved"
  | "approval_rejected"
  | "collaboration_comment"
  | "collaboration_shared"
  | "ai_analysis"
  | "ai_autofix"
  | "credential_added"
  | "credential_expired"
  | "environment_created"
  | "pipeline_run"
  | "user_login"
  | "team_member_added";

export type ActivitySeverity = "success" | "warning" | "error" | "info";

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  module: string;
  severity: ActivitySeverity;
  timestamp: string;
  link?: { module: string; label: string };
}

export const ACTIVITY_ICONS: Record<ActivityType, string> = {
  design_save: "LayoutDashboard",
  design_validate: "CheckCircle2",
  design_import: "Download",
  deploy_start: "Play",
  deploy_success: "Rocket",
  deploy_fail: "AlertCircle",
  deploy_promote: "ArrowUpFromLine",
  drift_detected: "GitCompare",
  drift_remediated: "Shield",
  drift_accepted: "CheckCircle2",
  cost_anomaly: "TrendingUp",
  cost_optimization: "WandSparkles",
  cost_saving: "DollarSign",
  compliance_violation: "ShieldAlert",
  compliance_fixed: "ShieldCheck",
  compliance_ok: "ShieldCheck",
  approval_requested: "UserCheck",
  approval_approved: "CheckCircle2",
  approval_rejected: "XCircle",
  collaboration_comment: "MessageSquare",
  collaboration_shared: "Share2",
  ai_analysis: "BrainCircuit",
  ai_autofix: "Wrench",
  credential_added: "Key",
  credential_expired: "AlertTriangle",
  environment_created: "Box",
  pipeline_run: "Play",
  user_login: "User",
  team_member_added: "UserPlus",
};

export const ACTIVITY_SEVERITY_STYLES: Record<ActivitySeverity, string> = {
  success: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  error: "bg-red-100 text-red-700",
  info: "bg-blue-100 text-blue-700",
};
