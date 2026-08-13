export type AppDeployStatus =
  "pending" | "deploying" | "running" | "success" | "failed" | "cancelled";

export type AppType =
  "web-app" | "microservice" | "data-pipeline" | "docker-compose" | null;

export type CiProvider = "github_actions" | "gitlab_ci";

export type DeployTargetType =
  "ecs_service" | "lambda" | "k8s_deployment" | "ec2";

export interface PipelineConfig {
  provider: CiProvider;
  yaml: string;
  repoPath: string;
  branch: string;
}

export interface DeployTarget {
  name: string;
  type: DeployTargetType;
  targetConfig: Record<string, string>;
}

export interface AppDeployment {
  id: string;
  repoId: string;
  appName: string;
  appType: AppType;
  environmentId: string;
  infraStackId: string;
  status: AppDeployStatus;
  url: string | null;
  pipelineYaml: string | null;
  ciProvider: CiProvider | null;
  targetType: DeployTargetType;
  version: string;
  deployedAt: string | null;
  lastHealthCheck: string | null;
  healthStatus: "healthy" | "degraded" | "down" | "unknown" | null;
  createdAt: string;
}

export const APP_TYPE_LABELS: Record<NonNullable<AppType>, string> = {
  "web-app": "Web App",
  microservice: "Microsserviço",
  "data-pipeline": "Data Pipeline",
  "docker-compose": "Docker Compose",
};

export const DEPLOY_STATUS_LABELS: Record<AppDeployStatus, string> = {
  pending: "Pendente",
  deploying: "Implantando",
  running: "Executando",
  success: "Sucesso",
  failed: "Falha",
  cancelled: "Cancelado",
};

export const DEPLOY_TARGET_LABELS: Record<DeployTargetType, string> = {
  ecs_service: "ECS Service",
  lambda: "Lambda",
  k8s_deployment: "Kubernetes Deployment",
  ec2: "EC2",
};

export const CI_PROVIDER_LABELS: Record<CiProvider, string> = {
  github_actions: "GitHub Actions",
  gitlab_ci: "GitLab CI",
};
