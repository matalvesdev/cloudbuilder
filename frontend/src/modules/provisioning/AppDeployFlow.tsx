import { useState, useMemo } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  XCircle,
  Globe,
  GitBranch,
  FileCode2,
  ExternalLink,
  Server,
  Box,
  Layers,
  Cpu,
  Github,
  GitFork,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRepoStore } from "@/store/repoStore";
import { useDeployStore } from "@/store/deployStore";
import { useCredentialStore } from "@/store/credentialStore";
import type { ConnectedRepo } from "@/types/repo.types";
import {
  APP_TYPE_LABELS,
  DEPLOY_TARGET_LABELS,
  CI_PROVIDER_LABELS,
  type AppType,
  type DeployTargetType,
  type CiProvider,
} from "@/types/deploy.types";

interface AppDeployFlowProps {
  environmentId: string;
  infraStackId: string;
  onClose: () => void;
  onDeployed: () => void;
}

type Step = "select-app" | "configure" | "pipeline" | "review";

function detectDeployTarget(
  appType: AppType,
  provider: string,
): DeployTargetType {
  if (appType === "data-pipeline") return "lambda";
  if (appType === "docker-compose" || appType === "microservice")
    return "ecs_service";
  if (provider === "k8s") return "k8s_deployment";
  return "ec2";
}

function generatePipelineYaml(
  ciProvider: CiProvider,
  repo: ConnectedRepo,
  appType: AppType,
  targetType: DeployTargetType,
): string {
  const appTypeSlug = appType || "app";
  const serviceName = repo.repoName;

  if (ciProvider === "github_actions") {
    return `name: Deploy ${serviceName}

on:
  push:
    branches: [${repo.defaultBranch}]
  pull_request:
    branches: [${repo.defaultBranch}]

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: ${serviceName}
  SERVICE_NAME: ${serviceName}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install Dependencies
        run: npm ci

      - name: Run Tests
        run: npm test

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/${repo.defaultBranch}'
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: \${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: \${{ env.AWS_REGION }}

      - name: Build Docker Image
        run: |
          docker build -t \${{ env.ECR_REPOSITORY }}:latest .
          docker tag \${{ env.ECR_REPOSITORY }}:latest \${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.\${{ env.AWS_REGION }}.amazonaws.com/\${{ env.ECR_REPOSITORY }}:latest

      - name: Push to ECR
        run: |
          aws ecr get-login-password --region \${{ env.AWS_REGION }} | docker login --username AWS --password-stdin \${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.\${{ env.AWS_REGION }}.amazonaws.com
          docker push \${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.\${{ env.AWS_REGION }}.amazonaws.com/\${{ env.ECR_REPOSITORY }}:latest

      - name: Deploy to ${DEPLOY_TARGET_LABELS[targetType]}
        run: |
          echo "Deploying ${serviceName} to ${targetType}..."${
            targetType === "ecs_service"
              ? `
          aws ecs update-service --cluster \${{ env.SERVICE_NAME }} --service \${{ env.SERVICE_NAME }} --force-new-deployment`
              : targetType === "lambda"
                ? `
          aws lambda update-function-code --function-name \${{ env.SERVICE_NAME }} --image-uri \${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.\${{ env.AWS_REGION }}.amazonaws.com/\${{ env.ECR_REPOSITORY }}:latest`
                : targetType === "k8s_deployment"
                  ? `
          kubectl set image deployment/\${{ env.SERVICE_NAME }} \${{ env.SERVICE_NAME }}=\${{ secrets.AWS_ACCOUNT_ID }}.dkr.ecr.\${{ env.AWS_REGION }}.amazonaws.com/\${{ env.ECR_REPOSITORY }}:latest`
                  : `
          echo "Deploying to EC2..."`
          }
`;
  }

  return `stages:
  - test
  - build
  - deploy

variables:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: ${serviceName}
  SERVICE_NAME: ${serviceName}

image: node:20

cache:
  key: \${CI_COMMIT_REF_SLUG}
  paths:
    - node_modules/

before_script:
  - npm ci

test:
  stage: test
  script:
    - npm test

build:
  stage: build
  script:
    - docker build -t $ECR_REPOSITORY:latest .
    - docker tag $ECR_REPOSITORY:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest
    - aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
    - docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest
  only:
    - ${repo.defaultBranch}

deploy:
  stage: deploy
  script:${
    targetType === "ecs_service"
      ? `
    - aws ecs update-service --cluster $SERVICE_NAME --service $SERVICE_NAME --force-new-deployment`
      : targetType === "lambda"
        ? `
    - aws lambda update-function-code --function-name $SERVICE_NAME --image-uri $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest`
        : targetType === "k8s_deployment"
          ? `
    - kubectl set image deployment/$SERVICE_NAME $SERVICE_NAME=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest`
          : `
    - echo "Deploying to EC2..."`
  }
  environment:
    name: production
  only:
    - ${repo.defaultBranch}
`;
}

export function AppDeployFlow({
  environmentId,
  infraStackId,
  onClose,
  onDeployed,
}: AppDeployFlowProps) {
  const [step, setStep] = useState<Step>("select-app");
  const [selectedRepoId, setSelectedRepoId] = useState<string>("");
  const [selectedTarget, setSelectedTarget] =
    useState<DeployTargetType>("ecs_service");
  const [appName, setAppName] = useState("");
  const [ciProvider, setCiProvider] = useState<CiProvider>("github_actions");
  const [deploying, setDeploying] = useState(false);
  const [deployDone, setDeployDone] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [appUrl, setAppUrl] = useState("");

  const connectedRepos = useRepoStore((s) => s.connectedRepos);
  const scanResults = useRepoStore((s) => s.scanResults);
  const detectAppType = useRepoStore((s) => s.detectAppType);
  const addAppDeployment = useDeployStore((s) => s.addAppDeployment);
  const updateAppDeployment = useDeployStore((s) => s.updateAppDeployment);
  const setDeployStatus = useDeployStore((s) => s.setDeployStatus);
  const environments = useCredentialStore((s) => s.environments);

  const environment = environments.find((e) => e.id === environmentId);

  const reposWithApp = useMemo(() => {
    return connectedRepos.filter((r) => {
      const detection = detectAppType(r.id);
      return detection.appType !== null || detection.hasDockerfile;
    });
  }, [connectedRepos, detectAppType]);

  const selectedRepo = connectedRepos.find((r) => r.id === selectedRepoId);
  const selectedDetection = selectedRepoId
    ? detectAppType(selectedRepoId)
    : null;
  const selectedScan = selectedRepoId
    ? scanResults.find((r) => r.repoId === selectedRepoId)
    : null;

  const detectedAppType = selectedDetection?.appType || null;

  const handleNext = () => {
    if (step === "select-app" && selectedRepoId) {
      const repo = connectedRepos.find((r) => r.id === selectedRepoId);
      if (repo) {
        setAppName(repo.repoName);
        setSelectedTarget(
          detectDeployTarget(detectedAppType, environment?.provider || "aws"),
        );
      }
      setStep("configure");
    } else if (step === "configure") {
      setStep("pipeline");
    } else if (step === "pipeline") {
      setStep("review");
    }
  };

  const handleBack = () => {
    if (step === "configure") setStep("select-app");
    else if (step === "pipeline") setStep("configure");
    else if (step === "review") setStep("pipeline");
  };

  const handleDeploy = async () => {
    if (!selectedRepo || !selectedDetection || !environment) return;
    setDeploying(true);
    setDeployError(null);

    try {
      await new Promise((r) => setTimeout(r, 1500));

      const pipelineYaml = generatePipelineYaml(
        ciProvider,
        selectedRepo,
        detectedAppType,
        selectedTarget,
      );
      const generatedUrl = `https://${appName}.${environment.region}.cloudbuilder.io`;

      const deployment = addAppDeployment({
        repoId: selectedRepo.id,
        appName: appName,
        appType: detectedAppType,
        environmentId: environmentId,
        infraStackId: infraStackId,
        targetType: selectedTarget,
        version: `v1.0.0-${Date.now()}`,
      });

      const pipelineYamlStr = generatePipelineYaml(
        ciProvider,
        selectedRepo,
        detectedAppType,
        selectedTarget,
      );
      updateAppDeployment(deployment.id, {
        pipelineYaml: pipelineYamlStr,
        ciProvider,
      });

      await new Promise((r) => setTimeout(r, 1000));

      setDeployStatus(deployment.id, "success", generatedUrl);
      setAppUrl(generatedUrl);
      setDeployDone(true);
      onDeployed();
    } catch {
      setDeployError("Falha ao realizar deploy da aplicação. Tente novamente.");
    } finally {
      setDeploying(false);
    }
  };

  const stepTitles: Record<Step, string> = {
    "select-app": "Selecionar Aplicação",
    configure: "Configurar Deploy",
    pipeline: "Pipeline CI/CD",
    review: "Review & Deploy",
  };

  const stepNumbers: Record<Step, number> = {
    "select-app": 1,
    configure: 2,
    pipeline: 3,
    review: 4,
  };

  const totalSteps = 4;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-brand-navy font-display">
              Deploy de Aplicação
            </h2>
            {environment && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-ice-blue text-brand-navy border border-ice-blue">
                <Globe className="w-3 h-3" />
                {environment.name}
              </span>
            )}
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {Array.from({ length: totalSteps }, (_, i) => {
              const current = stepNumbers[step];
              const idx = i + 1;
              return (
                <div key={i} className="flex items-center gap-2 flex-1">
                  <div
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all shrink-0",
                      idx < current
                        ? "bg-green-500 text-white"
                        : idx === current
                          ? "bg-brand-navy text-white"
                          : "bg-slate-100 text-slate-400",
                    )}
                  >
                    {idx < current ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      idx
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-[11px] font-medium hidden sm:block",
                      idx === current ? "text-brand-navy" : "text-slate-400",
                    )}
                  >
                    {Object.values(stepTitles)[i]}
                  </span>
                  {i < totalSteps - 1 && (
                    <div
                      className={cn(
                        "flex-1 h-px",
                        idx <= current ? "bg-green-500" : "bg-slate-200",
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* ─── Step 1: Select App ─── */}
          {step === "select-app" && (
            <>
              <p className="text-sm text-slate-500">
                Selecione o repositório da aplicação que deseja implantar na
                infraestrutura provisionada.
              </p>

              {reposWithApp.length === 0 ? (
                <div className="py-10 text-center">
                  <Box className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-500">
                    Nenhum repositório com aplicação detectada
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Conecte um repositório no módulo Platform para aparecer aqui
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {reposWithApp.map((repo) => {
                    const detection = detectAppType(repo.id);
                    const scan = scanResults.find((r) => r.repoId === repo.id);
                    const appType = detection?.appType;
                    const isSelected = selectedRepoId === repo.id;

                    return (
                      <button
                        key={repo.id}
                        onClick={() => setSelectedRepoId(repo.id)}
                        className={cn(
                          "w-full text-left p-4 rounded-xl border-2 transition-all",
                          isSelected
                            ? "border-brand-navy bg-brand-navy/5"
                            : "border-slate-200 hover:border-slate-300 bg-white",
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold",
                                repo.provider === "github"
                                  ? "bg-gray-800"
                                  : repo.provider === "gitlab"
                                    ? "bg-orange-500"
                                    : "bg-blue-600",
                              )}
                            >
                              {repo.provider === "github"
                                ? "GH"
                                : repo.provider === "gitlab"
                                  ? "GL"
                                  : "BB"}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-brand-navy">
                                {repo.fullName}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {appType && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-ice-blue text-brand-navy">
                                    {APP_TYPE_LABELS[
                                      appType as keyof typeof APP_TYPE_LABELS
                                    ] || appType}
                                  </span>
                                )}
                                {scan?.languages?.length && (
                                  <span className="text-[10px] text-slate-400">
                                    {scan.languages.join(", ")}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-5 h-5 text-brand-navy shrink-0" />
                          )}
                        </div>
                        {detection?.framework && (
                          <p className="text-[11px] text-slate-400 mt-2 ml-12">
                            Framework:{" "}
                            <span className="font-medium text-slate-500">
                              {detection.framework}
                            </span>
                            {detection.hasDockerfile &&
                              " · Dockerfile detectado"}
                            {detection.hasK8sManifest &&
                              " · Manifesto K8s detectado"}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ─── Step 2: Configure ─── */}
          {step === "configure" && selectedRepo && (
            <>
              <p className="text-sm text-slate-500">
                Configure como a aplicação{" "}
                <strong>{selectedRepo.fullName}</strong> será implantada na
                infraestrutura.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Nome da Aplicação
                  </label>
                  <input
                    type="text"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    className="w-full h-10 px-4 rounded-xl border border-slate-200 text-sm text-brand-navy font-medium outline-none focus:border-brand-navy transition-colors"
                    placeholder="my-app"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Tipo de Aplicação
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        "web-app",
                        "microservice",
                        "data-pipeline",
                        "docker-compose",
                      ] as const
                    ).map((type) => (
                      <button
                        key={type}
                        onClick={() => {}}
                        className={cn(
                          "flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium",
                          detectedAppType === type
                            ? "border-brand-navy bg-brand-navy/5 text-brand-navy"
                            : "border-slate-200 text-slate-400 opacity-60 cursor-default",
                        )}
                        disabled
                      >
                        {type === "web-app" ? (
                          <Globe className="w-4 h-4" />
                        ) : type === "microservice" ? (
                          <Box className="w-4 h-4" />
                        ) : type === "data-pipeline" ? (
                          <Layers className="w-4 h-4" />
                        ) : (
                          <Cpu className="w-4 h-4" />
                        )}
                        {APP_TYPE_LABELS[type]}
                      </button>
                    ))}
                  </div>
                  {detectedAppType && (
                    <p className="text-xs text-slate-400 mt-1.5">
                      Tipo detectado automaticamente a partir do código no
                      repositório
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Alvo de Deploy
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        "ecs_service",
                        "lambda",
                        "k8s_deployment",
                        "ec2",
                      ] as const
                    ).map((target) => {
                      const isRecommended =
                        target ===
                        detectDeployTarget(
                          detectedAppType,
                          environment?.provider || "aws",
                        );
                      return (
                        <button
                          key={target}
                          onClick={() => setSelectedTarget(target)}
                          className={cn(
                            "flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium relative",
                            selectedTarget === target
                              ? "border-brand-navy bg-brand-navy/5 text-brand-navy"
                              : "border-slate-200 text-slate-500 hover:border-slate-300",
                          )}
                        >
                          {target === "ecs_service" ? (
                            <Server className="w-4 h-4" />
                          ) : target === "lambda" ? (
                            <Cpu className="w-4 h-4" />
                          ) : target === "k8s_deployment" ? (
                            <Box className="w-4 h-4" />
                          ) : (
                            <Server className="w-4 h-4" />
                          )}
                          <span>{DEPLOY_TARGET_LABELS[target]}</span>
                          {isRecommended && (
                            <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-brand-lime text-brand-navy">
                              Recomendado
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ─── Step 3: Pipeline ─── */}
          {step === "pipeline" && selectedRepo && (
            <>
              <p className="text-sm text-slate-500">
                Configure o pipeline CI/CD para deploy automático da aplicação.
              </p>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Provedor de CI
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setCiProvider("github_actions")}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium",
                      ciProvider === "github_actions"
                        ? "border-brand-navy bg-brand-navy/5 text-brand-navy"
                        : "border-slate-200 text-slate-500 hover:border-slate-300",
                    )}
                  >
                    <Github className="w-4 h-4" />
                    GitHub Actions
                  </button>
                  <button
                    onClick={() => setCiProvider("gitlab_ci")}
                    disabled={selectedRepo.provider === "bitbucket"}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium",
                      ciProvider === "gitlab_ci"
                        ? "border-brand-navy bg-brand-navy/5 text-brand-navy"
                        : "border-slate-200 text-slate-500 hover:border-slate-300",
                      selectedRepo.provider === "bitbucket" &&
                        "opacity-40 cursor-not-allowed",
                    )}
                  >
                    <GitFork className="w-4 h-4" />
                    GitLab CI
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Pipeline YAML — Preview
                </label>
                <div className="relative group">
                  <button
                    onClick={async () => {
                      const yaml = generatePipelineYaml(
                        ciProvider,
                        selectedRepo,
                        detectedAppType,
                        selectedTarget,
                      );
                      await navigator.clipboard.writeText(yaml);
                    }}
                    className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium bg-white/10 text-slate-400 hover:bg-white/20 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <FileCode2 className="w-3 h-3" />
                    Copiar
                  </button>
                  <pre className="bg-[#0D1B2A] rounded-xl p-4 font-mono text-[10px] leading-relaxed max-h-[280px] overflow-y-auto text-slate-300 whitespace-pre scrollbar-thin border border-slate-700">
                    {generatePipelineYaml(
                      ciProvider,
                      selectedRepo,
                      detectedAppType,
                      selectedTarget,
                    )}
                  </pre>
                </div>
              </div>

              {selectedScan && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-ice-blue/30 border border-ice-blue">
                  <GitBranch className="w-4 h-4 text-brand-navy shrink-0" />
                  <p className="text-xs text-brand-navy">
                    Pipeline será configurado na branch{" "}
                    <strong>{selectedRepo.defaultBranch}</strong> de{" "}
                    <strong>{selectedRepo.fullName}</strong>
                  </p>
                </div>
              )}
            </>
          )}

          {/* ─── Step 4: Review ─── */}
          {step === "review" &&
            selectedRepo &&
            selectedDetection &&
            environment && (
              <>
                <p className="text-sm text-slate-500">
                  Revise os detalhes do deploy antes de confirmar.
                </p>

                <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Aplicação</span>
                    <span className="font-semibold text-brand-navy">
                      {appName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Repositório</span>
                    <span className="font-semibold text-brand-navy">
                      {selectedRepo.fullName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Tipo</span>
                    <span className="font-semibold text-brand-navy">
                      {detectedAppType
                        ? APP_TYPE_LABELS[
                            detectedAppType as keyof typeof APP_TYPE_LABELS
                          ]
                        : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Alvo</span>
                    <span className="font-semibold text-brand-navy">
                      {DEPLOY_TARGET_LABELS[selectedTarget]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Ambiente</span>
                    <span className="font-semibold text-brand-navy">
                      {environment.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">CI Provider</span>
                    <span className="font-semibold text-brand-navy">
                      {CI_PROVIDER_LABELS[ciProvider]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Branch</span>
                    <span className="font-semibold text-brand-navy">
                      {selectedRepo.defaultBranch}
                    </span>
                  </div>
                </div>

                {deployError && (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
                    <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-red-700">
                        Erro no deploy
                      </p>
                      <p className="text-xs text-red-500">{deployError}</p>
                    </div>
                  </div>
                )}

                {deployDone && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
                      <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-green-700">
                          Deploy realizado com sucesso!
                        </p>
                        <p className="text-xs text-green-500">
                          Aplicação implantada e saudável
                        </p>
                      </div>
                    </div>
                    {appUrl && (
                      <a
                        href={appUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 rounded-xl bg-ice-blue/30 border border-ice-blue text-brand-navy hover:bg-ice-blue/50 transition-all text-sm font-medium"
                      >
                        <ExternalLink className="w-4 h-4" />
                        {appUrl}
                      </a>
                    )}
                  </div>
                )}

                {deploying && (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-500 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-blue-700">
                        Implantando aplicação...
                      </p>
                      <p className="text-xs text-blue-500">
                        Configurando infraestrutura e fazendo deploy
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 flex items-center justify-between border-t border-slate-100">
          <div>
            {step !== "select-app" && !deployDone && (
              <button
                onClick={handleBack}
                disabled={deploying}
                className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all disabled:opacity-50"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Voltar
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={deploying}
              className="px-4 h-9 rounded-full text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all disabled:opacity-50"
            >
              {deployDone ? "Fechar" : "Cancelar"}
            </button>

            {!deployDone && step !== "review" && (
              <button
                onClick={handleNext}
                disabled={step === "select-app" && !selectedRepoId}
                className="inline-flex items-center gap-1.5 px-5 h-9 rounded-full text-xs font-bold bg-brand-navy text-white hover:bg-[#0D1B2A] transition-all disabled:opacity-50"
              >
                {step === "pipeline" ? "Revisar" : "Continuar"}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {!deployDone && step === "review" && (
              <button
                onClick={handleDeploy}
                disabled={deploying}
                className="inline-flex items-center gap-1.5 px-5 h-9 rounded-full text-xs font-bold bg-brand-navy text-white hover:bg-[#0D1B2A] transition-all disabled:opacity-50"
              >
                {deploying ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                {deploying ? "Implantando..." : "Deploy Direto"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
