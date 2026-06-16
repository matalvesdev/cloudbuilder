package com.cloudbuilder.codeanalysis.domain.service;

import com.cloudbuilder.codeanalysis.application.dto.CodeAnalysisResponse;
import com.cloudbuilder.codeanalysis.application.dto.CodeAnalysisRequest.SourceFile;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Analyzes source code files to detect the technology stack and infer
 * the required cloud infrastructure.
 *
 * Detects frameworks from: package.json, requirements.txt, Dockerfile,
 * docker-compose.yml, go.mod, pom.xml, build.gradle, Gemfile, k8s/*.yaml
 *
 * Inference rules map detected tech → cloud resources (EC2, RDS, ALB, etc.)
 */
@Service
public class CodeAnalyzerService {

    // Technology detection rules
    private static final List<Detector> DETECTORS = List.of(
        // ── JavaScript / TypeScript ──
        new Detector("package.json", "Express.js", "Node.js web framework",
            Set.of("express"), "backend"),
        new Detector("package.json", "Next.js", "React SSR framework",
            Set.of("next"), "frontend"),
        new Detector("package.json", "NestJS", "Node.js framework",
            Set.of("@nestjs/core"), "backend"),
        new Detector("package.json", "React", "Frontend library",
            Set.of("react", "react-dom"), "frontend"),
        new Detector("package.json", "Vue.js", "Frontend framework",
            Set.of("vue"), "frontend"),
        new Detector("package.json", "Angular", "Frontend framework",
            Set.of("@angular/core"), "frontend"),

        // ── Python ──
        new Detector("requirements.txt", "Django", "Python web framework",
            Set.of("django"), "backend"),
        new Detector("requirements.txt", "FastAPI", "Python async API",
            Set.of("fastapi"), "backend"),
        new Detector("requirements.txt", "Flask", "Python microframework",
            Set.of("flask"), "backend"),

        // ── Java / JVM ──
        new Detector("pom.xml", "Spring Boot", "Java web framework",
            Set.of("spring-boot-starter-web"), "backend"),
        new Detector("build.gradle", "Spring Boot", "Java web framework (Gradle)",
            Set.of("spring-boot"), "backend"),

        // ── Go ──
        new Detector("go.mod", "Go API", "Go HTTP service",
            Set.of("gin-gonic/gin", "gorilla/mux", "fiber"), "backend"),

        // ── Ruby ──
        new Detector("Gemfile", "Ruby on Rails", "Ruby web framework",
            Set.of("rails"), "backend"),

        // ── PHP ──
        new Detector("composer.json", "Laravel", "PHP web framework",
            Set.of("laravel/framework"), "backend"),

        // ── Databases (from dependency files) ──
        new DbDetector("package.json", "PostgreSQL", Set.of("pg", "pg-native", "sequelize", "prisma", "typeorm")),
        new DbDetector("requirements.txt", "PostgreSQL", Set.of("psycopg2", "psycopg2-binary", "asyncpg", "sqlalchemy")),
        new DbDetector("package.json", "MySQL", Set.of("mysql", "mysql2")),
        new DbDetector("requirements.txt", "MySQL", Set.of("mysql-connector-python", "pymysql")),
        new DbDetector("package.json", "MongoDB", Set.of("mongodb", "mongoose", "mongoose")),
        new DbDetector("package.json", "Redis", Set.of("redis", "ioredis", "redis-client")),
        new DbDetector("requirements.txt", "Redis", Set.of("redis", "django-redis", "redis-py")),
        new DbDetector("package.json", "Elasticsearch", Set.of("elasticsearch", "@elastic/elasticsearch")),
        new DbDetector("docker-compose.yml", "PostgreSQL", Set.of("postgres", "postgresql")),
        new DbDetector("docker-compose.yml", "MySQL", Set.of("mysql")),
        new DbDetector("docker-compose.yml", "MongoDB", Set.of("mongo", "mongodb")),
        new DbDetector("docker-compose.yml", "Redis", Set.of("redis"))
    );

    // Inference rules: detected tech → required cloud resources
    private static final List<InferenceRule> INFERENCE_RULES = List.of(
        // Backend frameworks → compute
        new InferenceRule(Set.of("Express.js", "Next.js", "NestJS", "Django", "FastAPI", "Flask",
            "Spring Boot", "Go API", "Ruby on Rails", "Laravel"),
            "aws_ecs_service", "aws", "ECS Fargate",
            "Serviço conteinerizado para aplicação web", 0.75,
            Map.of("launch_type", "FARGATE", "desired_count", "2")),

        // Frontend → S3 + CloudFront
        new InferenceRule(Set.of("React", "Vue.js", "Angular", "Next.js"),
            "aws_s3_bucket", "aws", "S3 Bucket (Frontend)",
            "Bucket para hospedar frontend estático", 0.85,
            Map.of("acl", "public-read")),

        // Database: PostgreSQL → RDS
        new InferenceRule(Set.of("PostgreSQL"),
            "aws_db_instance", "aws", "RDS PostgreSQL",
            "Banco de dados PostgreSQL gerenciado", 0.80,
            Map.of("engine", "postgres", "instance_class", "db.t3.medium")),

        // Database: MySQL → RDS
        new InferenceRule(Set.of("MySQL"),
            "aws_db_instance", "aws", "RDS MySQL",
            "Banco de dados MySQL gerenciado", 0.80,
            Map.of("engine", "mysql", "instance_class", "db.t3.medium")),

        // Database: MongoDB → DocumentDB
        new InferenceRule(Set.of("MongoDB"),
            "aws_docdb_cluster", "aws", "DocumentDB",
            "Banco MongoDB-compatível gerenciado", 0.60,
            Map.of("engine", "docdb")),

        // Redis → ElastiCache
        new InferenceRule(Set.of("Redis"),
            "aws_elasticache_cluster", "aws", "ElastiCache Redis",
            "Cache Redis gerenciado", 0.85,
            Map.of("engine", "redis", "node_type", "cache.t3.micro")),

        // Message queue (from Docker Compose)
        new InferenceRule(Set.of("rabbitmq", "RabbitMQ"),
            "aws_sqs_queue", "aws", "SQS Queue",
            "Fila de mensagens gerenciada", 0.60,
            Map.of("visibility_timeout_seconds", "30")),

        // Load balancer (detected from multiple backend services)
        new InferenceRule(Set.of("Express.js", "NestJS", "Django", "FastAPI", "Spring Boot", "Go API"),
            "aws_lb", "aws", "Application Load Balancer",
            "Load balancer para distribuir tráfego", 0.50,
            Map.of("load_balancer_type", "application")),

        // VPC (always needed)
        new InferenceRule(Set.of("Express.js", "Next.js", "Django", "Spring Boot", "Go API",
            "PostgreSQL", "MySQL", "Redis"),
            "aws_vpc", "aws", "VPC",
            "Rede privada virtual isolada", 0.95,
            Map.of("cidr_block", "10.0.0.0/16")),

        // Docker → ECS
        new DockerfileRule()
    );

    public CodeAnalysisResponse analyze(String repoUrl, List<SourceFile> files) {
        List<String> warnings = new ArrayList<>();
        Map<String, Set<String>> detectedTech = new HashMap<>(); // filePattern → detected techs

        // Phase 1: Run detectors
        for (SourceFile file : files) {
            String fileName = file.fileName();
            String content = file.content();
            if (content == null) continue;

            for (Detector detector : DETECTORS) {
                if (matchesFile(fileName, detector.filePattern())) {
                    if (detector.matches(content)) {
                        detectedTech.computeIfAbsent(fileName, k -> new HashSet<>()).add(detector.techName());
                    }
                }
            }
        }

        // Phase 2: Collect all detected technologies with their categories
        Set<String> allTech = detectedTech.values().stream()
            .flatMap(Set::stream)
            .collect(Collectors.toCollection(LinkedHashSet::new));

        List<String> frameworks = new ArrayList<>(allTech);

        // Determine stack name
        String stackName = determineStackName(allTech);
        String stackDescription = describeStack(allTech);

        // Phase 3: Infer infrastructure resources
        List<CodeAnalysisResponse.InferredResource> inferredResources = new ArrayList<>();
        Set<String> seenResources = new HashSet<>();

        for (InferenceRule rule : INFERENCE_RULES) {
            for (String tech : allTech) {
                if (rule.appliesTo(tech) && seenResources.add(rule.resourceType())) {
                    inferredResources.add(new CodeAnalysisResponse.InferredResource(
                        rule.resourceType(),
                        rule.provider(),
                        rule.displayName(),
                        rule.description(),
                        rule.confidence(),
                        findEvidence(files, rule.resourceType()),
                        rule.suggestedProperties()
                    ));
                    break;
                }
            }
        }

        if (inferredResources.isEmpty()) {
            warnings.add("Nenhuma tecnologia conhecida detectada. Adicione os arquivos do seu projeto.");
        }

        // Sort by confidence (highest first)
        inferredResources.sort((a, b) -> Double.compare(b.confidence(), a.confidence()));

        return new CodeAnalysisResponse(
            repoUrl != null ? repoUrl : "",
            stackName,
            stackDescription,
            frameworks,
            inferredResources,
            warnings
        );
    }

    private boolean matchesFile(String fileName, String pattern) {
        // Exact match or glob-like match
        if (fileName.equals(pattern)) return true;
        if (fileName.endsWith("/" + pattern)) return true;
        // Pattern like "k8s/*.yaml"
        if (pattern.contains("*") && fileName.matches(pattern.replace("*", ".*"))) return true;
        return false;
    }

    private List<String> findEvidence(List<SourceFile> files, String resourceType) {
        List<String> evidence = new ArrayList<>();
        for (SourceFile file : files) {
            if (file.fileName().endsWith(".json") || file.fileName().endsWith(".txt")
                || file.fileName().endsWith(".yml") || file.fileName().endsWith(".yaml")) {
                evidence.add(file.fileName());
            }
        }
        return evidence.isEmpty() ? List.of("code analysis") : evidence;
    }

    private String determineStackName(Set<String> techs) {
        if (techs.contains("Next.js")) return "Next.js Fullstack";
        if (techs.contains("Django")) return "Django Python";
        if (techs.contains("Spring Boot")) return "Spring Boot Java";
        if (techs.contains("Express.js")) return "Node.js Express";
        if (techs.contains("Go API")) return "Go API";
        if (techs.contains("Ruby on Rails")) return "Ruby on Rails";
        if (techs.contains("Laravel")) return "Laravel PHP";
        if (techs.contains("FastAPI")) return "FastAPI Python";
        if (techs.contains("Flask")) return "Flask Python";
        return "Custom Stack";
    }

    private String describeStack(Set<String> techs) {
        if (techs.isEmpty()) return "Stack não identificada";
        return String.join(", ", techs);
    }

    // ── Detectors ──

    static class Detector {
        private final String filePattern;
        private final String techName;
        private final String techDescription;
        private final Set<String> indicators;
        private final String category;

        Detector(String filePattern, String techName, String techDescription,
                 Set<String> indicators, String category) {
            this.filePattern = filePattern;
            this.techName = techName;
            this.techDescription = techDescription;
            this.indicators = indicators;
            this.category = category;
        }

        String filePattern() { return filePattern; }
        String techName() { return techName; }
        String techDescription() { return techDescription; }
        Set<String> indicators() { return indicators; }
        String category() { return category; }

        boolean matches(String content) {
            String lower = content.toLowerCase();
            for (String ind : indicators) {
                if (lower.contains(ind.toLowerCase())) return true;
            }
            return false;
        }
    }

    static class DbDetector extends Detector {
        DbDetector(String filePattern, String dbName, Set<String> indicators) {
            super(filePattern, dbName, "Database: " + dbName, indicators, "database");
        }
    }

    // ── Inference Rules ──

    static class InferenceRule {
        private final Set<String> requiredTechs;
        private final String resourceType;
        private final String provider;
        private final String displayName;
        private final String description;
        private final double confidence;
        private final Map<String, Object> suggestedProperties;

        InferenceRule(Set<String> requiredTechs, String resourceType, String provider,
                      String displayName, String description, double confidence,
                      Map<String, Object> suggestedProperties) {
            this.requiredTechs = requiredTechs;
            this.resourceType = resourceType;
            this.provider = provider;
            this.displayName = displayName;
            this.description = description;
            this.confidence = confidence;
            this.suggestedProperties = suggestedProperties;
        }

        Set<String> requiredTechs() { return requiredTechs; }
        String resourceType() { return resourceType; }
        String provider() { return provider; }
        String displayName() { return displayName; }
        String description() { return description; }
        double confidence() { return confidence; }
        Map<String, Object> suggestedProperties() { return suggestedProperties; }

        boolean appliesTo(String tech) {
            return requiredTechs.contains(tech);
        }
    }

    static class DockerfileRule extends InferenceRule {
        DockerfileRule() {
            super(Set.of("Dockerfile"), "aws_ecs_cluster", "aws",
                "ECS Cluster", "Cluster para orquestração de contêineres",
                0.70, Map.of("cluster_name", "app-cluster"));
        }
    }
}
