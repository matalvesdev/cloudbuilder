package com.cloudbuilder.observe.domain.service;

import com.cloudbuilder.git.domain.model.ConnectedRepository;
import com.cloudbuilder.git.domain.model.GitPushEvent;
import com.cloudbuilder.git.domain.port.ConnectedRepositoryPort;
import com.cloudbuilder.github.infrastructure.client.GitHubApiClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Listens for {@link GitPushEvent} and auto-registers services in Observe
 * when Terraform resource definitions are detected in the pushed repository.
 * <p>
 * This bridges Git → Observe, implementing the "auto-register from Terraform"
 * missing piece. Each Terraform resource type maps to a ServiceHealth entry
 * so the Observability dashboard automatically reflects infrastructure changes.
 */
@Service
public class TerraformResourceObserver {

    private static final Logger log = LoggerFactory.getLogger(TerraformResourceObserver.class);

    // Pattern to detect Terraform resource blocks
    private static final Pattern RESOURCE_PATTERN = Pattern.compile(
            "^(resource|data)\\s+\"([^\"]+)\"\\s+\"([^\"]+)\"\\s*\\{",
            Pattern.MULTILINE
    );

    // Map Terraform resource type prefix → friendly service name
    private static final Map<String, String> SERVICE_NAME_MAP = createServiceNameMap();

    private final ConnectedRepositoryPort repositoryPort;
    private final GitHubApiClient gitHubApiClient;
    private final HealthCheckService healthCheckService;

    public TerraformResourceObserver(ConnectedRepositoryPort repositoryPort,
                                      GitHubApiClient gitHubApiClient,
                                      HealthCheckService healthCheckService) {
        this.repositoryPort = repositoryPort;
        this.gitHubApiClient = gitHubApiClient;
        this.healthCheckService = healthCheckService;
    }

    /**
     * Triggered when a Git push event is received.
     * Fetches .tf files from the repository, detects resource types,
     * and auto-registers each as a ServiceHealth entry with a "healthy" initial status.
     */
    @EventListener
    @Transactional
    public void onGitPush(GitPushEvent event) {
        String repoId = event.getRepoId();
        log.info("Auto-registering services from push to repo: {}, branch: {}",
                repoId, event.getBranch());

        ConnectedRepository repo = repositoryPort.findById(repoId).orElse(null);
        if (repo == null) {
            log.warn("Repositório não encontrado para auto-registro: {}", repoId);
            return;
        }

        String token = repo.getAccessToken();
        if (token == null || token.isBlank()) {
            log.warn("Token não disponível para auto-registro: {}", repo.getFullName());
            return;
        }

        try {
            // ── Step 1: Fetch .tf files from the repo ──
            List<String> tfContents = fetchTerraformFiles(token, repo.getOwner(),
                    repo.getRepoName(), event.getBranch());

            if (tfContents.isEmpty()) {
                log.info("Nenhum arquivo .tf encontrado no push para {}/{}",
                        repo.getOwner(), repo.getRepoName());
                return;
            }

            // ── Step 2: Extract unique service names from resource types ──
            Set<String> detectedServices = new LinkedHashSet<>();

            for (String content : tfContents) {
                if (content == null || content.isBlank()) continue;

                Matcher matcher = RESOURCE_PATTERN.matcher(content);
                while (matcher.find()) {
                    String fullType = matcher.group(2); // e.g. "aws_vpc"
                    String serviceName = SERVICE_NAME_MAP.getOrDefault(fullType, fullType);
                    detectedServices.add(serviceName);
                }
            }

            if (detectedServices.isEmpty()) {
                log.info("Nenhum recurso Terraform detectado no push");
                return;
            }

            // ── Step 3: Auto-register each service as healthy ──
            // Use repoId as the environmentId for service grouping
            String environmentId = repoId;

            int registeredCount = 0;
            for (String serviceName : detectedServices) {
                // Check if already registered in the last 5 minutes
                var existing = healthCheckService.getLatestHealth(serviceName, environmentId);
                if (existing.isPresent()) {
                    long secondsSinceCheck = java.time.Duration.between(
                            existing.get().getCheckedAt(), Instant.now()).getSeconds();
                    if (secondsSinceCheck < 300) {
                        continue; // Skip if recently registered
                    }
                }

                healthCheckService.recordHealth(
                        serviceName,
                        environmentId,
                        "healthy",
                        0,    // initial latency
                        100.0 // initial uptime
                );
                registeredCount++;
            }

            log.info("Auto-registrados {} serviços em Observe para repo {}: {}",
                    registeredCount, repo.getFullName(), detectedServices);

        } catch (Exception e) {
            log.error("Erro ao auto-registrar serviços do repo {}: {}",
                    repo.getFullName(), e.getMessage(), e);
        }
    }

    /**
     * Fetch all .tf file contents from a repository at a given branch.
     */
    private List<String> fetchTerraformFiles(String token, String owner,
                                              String repo, String branch) throws Exception {
        String targetBranch = (branch != null && !branch.isBlank()) ? branch : "main";
        List<String> contents = new ArrayList<>();

        try {
            List<GitHubApiClient.GitHubFile> items = gitHubApiClient.listContents(
                    token, owner, repo, "", targetBranch);

            for (GitHubApiClient.GitHubFile item : items) {
                if ("file".equals(item.type()) && item.name().endsWith(".tf")) {
                    try {
                        String content = gitHubApiClient.getFileContent(
                                token, owner, repo, item.path(), targetBranch);
                        if (content != null && !content.isBlank()) {
                            contents.add(content);
                        }
                    } catch (Exception e) {
                        log.debug("Não foi possível ler {}: {}", item.path(), e.getMessage());
                    }
                } else if ("dir".equals(item.type())) {
                    // Recurse into common Terraform directories
                    if (isTerraformDir(item.name())) {
                        contents.addAll(fetchTerraformFilesRecursive(
                                token, owner, repo, item.path(), targetBranch));
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Erro ao listar arquivos do repo {}/{}: {}", owner, repo, e.getMessage());
        }

        return contents;
    }

    private List<String> fetchTerraformFilesRecursive(String token, String owner,
                                                       String repo, String path,
                                                       String branch) throws Exception {
        List<String> contents = new ArrayList<>();
        List<GitHubApiClient.GitHubFile> items = gitHubApiClient.listContents(
                token, owner, repo, path, branch);

        for (GitHubApiClient.GitHubFile item : items) {
            if ("file".equals(item.type()) && item.name().endsWith(".tf")) {
                try {
                    String content = gitHubApiClient.getFileContent(
                            token, owner, repo, item.path(), branch);
                    if (content != null && !content.isBlank()) {
                        contents.add(content);
                    }
                } catch (Exception e) {
                    log.debug("Não foi possível ler {}: {}", item.path(), e.getMessage());
                }
            } else if ("dir".equals(item.type())) {
                contents.addAll(fetchTerraformFilesRecursive(
                        token, owner, repo, item.path(), branch));
            }
        }

        return contents;
    }

    private boolean isTerraformDir(String name) {
        return name.equals("terraform") || name.equals("infra")
                || name.equals("infrastructure") || name.equals("iac")
                || name.equals("modules") || name.equals("environments");
    }

    private static Map<String, String> createServiceNameMap() {
        Map<String, String> m = new LinkedHashMap<>();
        // AWS
        m.put("aws_vpc", "VPC");
        m.put("aws_subnet", "Subnet");
        m.put("aws_instance", "EC2");
        m.put("aws_security_group", "Security Group");
        m.put("aws_db_instance", "RDS");
        m.put("aws_s3_bucket", "S3 Bucket");
        m.put("aws_lb", "Load Balancer");
        m.put("aws_alb", "ALB");
        m.put("aws_nlb", "NLB");
        m.put("aws_ecs_cluster", "ECS Cluster");
        m.put("aws_ecs_service", "ECS Service");
        m.put("aws_eks_cluster", "EKS Cluster");
        m.put("aws_lambda_function", "Lambda");
        m.put("aws_sqs_queue", "SQS");
        m.put("aws_sns_topic", "SNS");
        m.put("aws_dynamodb_table", "DynamoDB");
        m.put("aws_elasticache_cluster", "ElastiCache");
        m.put("aws_rds_cluster", "RDS Cluster");
        m.put("aws_api_gateway_rest_api", "API Gateway");
        m.put("aws_cloudfront_distribution", "CloudFront");
        m.put("aws_ecr_repository", "ECR");
        m.put("aws_route53_zone", "Route53");
        // Azure
        m.put("azurerm_virtual_network", "VNet");
        m.put("azurerm_kubernetes_cluster", "AKS");
        m.put("azurerm_linux_virtual_machine", "Linux VM");
        m.put("azurerm_windows_virtual_machine", "Windows VM");
        m.put("azurerm_storage_account", "Storage Account");
        m.put("azurerm_sql_database", "SQL Database");
        m.put("azurerm_cosmosdb_account", "CosmosDB");
        m.put("azurerm_redis_cache", "Redis");
        m.put("azurerm_container_registry", "ACR");
        m.put("azurerm_function_app", "Function App");
        m.put("azurerm_app_service", "App Service");
        // GCP
        m.put("google_compute_instance", "Compute Engine");
        m.put("google_container_cluster", "GKE");
        m.put("google_storage_bucket", "Storage Bucket");
        m.put("google_cloud_run_service", "Cloud Run");
        m.put("google_sql_database_instance", "Cloud SQL");
        m.put("google_functions_function", "Cloud Function");
        m.put("google_bigquery_dataset", "BigQuery");
        m.put("google_pubsub_topic", "Pub/Sub");
        // K8s
        m.put("kubernetes_deployment", "Deployment");
        m.put("kubernetes_service", "Service");
        m.put("kubernetes_namespace", "Namespace");
        m.put("kubernetes_ingress", "Ingress");
        m.put("kubernetes_config_map", "ConfigMap");
        m.put("kubernetes_stateful_set", "StatefulSet");
        m.put("kubernetes_persistent_volume_claim", "PVC");
        return Collections.unmodifiableMap(m);
    }
}
