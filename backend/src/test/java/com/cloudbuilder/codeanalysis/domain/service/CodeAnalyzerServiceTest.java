package com.cloudbuilder.codeanalysis.domain.service;

import com.cloudbuilder.codeanalysis.application.dto.CodeAnalysisRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class CodeAnalyzerServiceTest {

    private CodeAnalyzerService analyzer;

    @BeforeEach
    void setUp() {
        analyzer = new CodeAnalyzerService();
    }

    @Test
    void analyze_WithExpressJs_ShouldDetectFrameworkAndResources() {
        var files = List.of(
                new CodeAnalysisRequest.SourceFile("package.json", "/", """
                        {"dependencies": {"express": "^4.18.0"}}
                        """)
        );

        var result = analyzer.analyze("https://github.com/user/repo", files);

        assertTrue(result.detectedFrameworks().contains("Express.js"));
        assertFalse(result.inferredResources().isEmpty());
        assertTrue(result.warnings().isEmpty());
    }

    @Test
    void analyze_WithReact_ShouldDetectFrontendAndS3() {
        var files = List.of(
                new CodeAnalysisRequest.SourceFile("package.json", "/", """
                        {"dependencies": {"react": "^18.0.0", "react-dom": "^18.0.0"}}
                        """)
        );

        var result = analyzer.analyze(null, files);

        assertTrue(result.detectedFrameworks().contains("React"));
        boolean hasS3 = result.inferredResources().stream()
                .anyMatch(r -> r.resourceType().equals("aws_s3_bucket"));
        assertTrue(hasS3);
    }

    @Test
    void analyze_WithDjangoRequirements_ShouldDetectPythonStack() {
        var files = List.of(
                new CodeAnalysisRequest.SourceFile("requirements.txt", "/", "django==4.2\npsycopg2==2.9")
        );

        var result = analyzer.analyze("https://github.com/user/repo", files);

        assertTrue(result.detectedFrameworks().contains("Django"));
        assertTrue(result.detectedFrameworks().contains("PostgreSQL"));
    }

    @Test
    void analyze_WithSpringBoot_ShouldDetectJavaStack() {
        var files = List.of(
                new CodeAnalysisRequest.SourceFile("pom.xml", "/", """
                        <dependency>
                            <groupId>org.springframework.boot</groupId>
                            <artifactId>spring-boot-starter-web</artifactId>
                        </dependency>
                        """)
        );

        var result = analyzer.analyze(null, files);

        assertTrue(result.detectedFrameworks().contains("Spring Boot"));
        assertEquals("Spring Boot Java", result.detectedStack());
    }

    @Test
    void analyze_WithGoMod_ShouldDetectGoStack() {
        var files = List.of(
                new CodeAnalysisRequest.SourceFile("go.mod", "/", "module github.com/user/app\nrequire github.com/gin-gonic/gin v1.9.0")
        );

        var result = analyzer.analyze(null, files);

        assertTrue(result.detectedFrameworks().contains("Go API"));
        assertEquals("Go API", result.detectedStack());
    }

    @Test
    void analyze_WithDockerfile_ShouldDetectEcsCluster() {
        var files = List.of(
                new CodeAnalysisRequest.SourceFile("Dockerfile", "/", "FROM node:18\nCOPY . /app\nCMD [\"npm\", \"start\"]")
        );

        var result = analyzer.analyze(null, files);

        boolean hasEcsCluster = result.inferredResources().stream()
                .anyMatch(r -> r.resourceType().equals("aws_ecs_cluster"));
        assertTrue(hasEcsCluster);
    }

    @Test
    void analyze_WithEmptyFiles_ShouldReturnCustomStackWithWarning() {
        var result = analyzer.analyze(null, List.of());

        assertEquals("Custom Stack", result.detectedStack());
        assertFalse(result.warnings().isEmpty());
        assertTrue(result.warnings().getFirst().contains("Nenhuma tecnologia conhecida"));
    }

    @Test
    void analyze_WithNullContent_ShouldSkipFile() {
        var files = List.of(
                new CodeAnalysisRequest.SourceFile("package.json", "/", null)
        );

        var result = analyzer.analyze(null, files);

        assertEquals("Custom Stack", result.detectedStack());
    }

    @Test
    void analyze_WithNextJsAndPostgres_ShouldDetectFullstack() {
        var files = List.of(
                new CodeAnalysisRequest.SourceFile("package.json", "/", """
                        {"dependencies": {"next": "^14.0.0", "react": "^18.0.0", "pg": "^8.0.0"}}
                        """)
        );

        var result = analyzer.analyze(null, files);

        assertTrue(result.detectedFrameworks().contains("Next.js"));
        assertTrue(result.detectedFrameworks().contains("PostgreSQL"));
        assertEquals("Next.js Fullstack", result.detectedStack());
        // Next.js should infer both S3 (frontend) and RDS (database) and ECS (backend)
        assertTrue(result.inferredResources().size() >= 2);
    }

    @Test
    void analyze_ShouldSortByConfidenceDescending() {
        var files = List.of(
                new CodeAnalysisRequest.SourceFile("package.json", "/", """
                        {"dependencies": {"express": "^4.18.0", "react": "^18.0.0", "pg": "^8.0.0"}}
                        """)
        );

        var result = analyzer.analyze(null, files);

        for (int i = 0; i < result.inferredResources().size() - 1; i++) {
            assertTrue(result.inferredResources().get(i).confidence()
                    >= result.inferredResources().get(i + 1).confidence());
        }
    }

    @Test
    void analyze_ShouldNotDuplicateResources() {
        var files = List.of(
                new CodeAnalysisRequest.SourceFile("package.json", "/", """
                        {"dependencies": {"express": "^4.18.0"}}
                        """),
                new CodeAnalysisRequest.SourceFile("go.mod", "/", "module app")
        );

        var result = analyzer.analyze(null, files);

        // VPC should only appear once even if triggered by multiple techs
        long vpcCount = result.inferredResources().stream()
                .filter(r -> r.resourceType().equals("aws_vpc"))
                .count();
        assertEquals(1, vpcCount);
    }

    @Test
    void analyze_WithNullRepoUrl_ShouldReturnEmptyRepoUrl() {
        var files = List.of(
                new CodeAnalysisRequest.SourceFile("package.json", "/", "{\"dependencies\": {\"express\": \"^4\"}}")
        );

        var result = analyzer.analyze(null, files);

        assertEquals("", result.repoUrl());
    }

    @Test
    void analyze_WithRails_ShouldDetectRubyStack() {
        var files = List.of(
                new CodeAnalysisRequest.SourceFile("Gemfile", "/", "gem 'rails'")
        );

        var result = analyzer.analyze(null, files);

        assertTrue(result.detectedFrameworks().contains("Ruby on Rails"));
        assertEquals("Ruby on Rails", result.detectedStack());
    }

    @Test
    void analyze_WithFastApi_ShouldDetectPythonAsync() {
        var files = List.of(
                new CodeAnalysisRequest.SourceFile("requirements.txt", "/", "fastapi==0.104.0\nuvicorn==0.24.0")
        );

        var result = analyzer.analyze(null, files);

        assertTrue(result.detectedFrameworks().contains("FastAPI"));
        assertEquals("FastAPI Python", result.detectedStack());
    }

    @Test
    void analyze_WithDockerComposeRedis_ShouldDetectElastiCache() {
        var files = List.of(
                new CodeAnalysisRequest.SourceFile("docker-compose.yml", "/", """
                        services:
                          redis:
                            image: redis:7-alpine
                        """)
        );

        var result = analyzer.analyze(null, files);

        assertTrue(result.detectedFrameworks().contains("Redis"));
        boolean hasElastiCache = result.inferredResources().stream()
                .anyMatch(r -> r.resourceType().equals("aws_elasticache_cluster"));
        assertTrue(hasElastiCache);
    }

    @Test
    void analyze_WithEvidence_ShouldIncludeFileNames() {
        var files = List.of(
                new CodeAnalysisRequest.SourceFile("package.json", "/", "{\"dependencies\": {\"express\": \"^4\"}}")
        );

        var result = analyzer.analyze(null, files);

        boolean hasEvidence = result.inferredResources().stream()
                .anyMatch(r -> r.evidence().contains("package.json"));
        assertTrue(hasEvidence);
    }

    @Test
    void analyze_WithNoDependencyFiles_ShouldReturnEmptyEvidence() {
        var files = List.of(
                new CodeAnalysisRequest.SourceFile("Dockerfile", "/", "FROM node:18")
        );

        var result = analyzer.analyze(null, files);

        boolean hasFileEvidence = result.inferredResources().stream()
                .anyMatch(r -> r.evidence().stream().anyMatch(e -> e.contains(".")));
        assertFalse(hasFileEvidence);
    }

    @Test
    void analyze_WithMultipleBackendFrameworks_ShouldInferVpc() {
        var files = List.of(
                new CodeAnalysisRequest.SourceFile("package.json", "/", """
                        {"dependencies": {"express": "^4.18.0"}}
                        """)
        );

        var result = analyzer.analyze(null, files);

        boolean hasVpc = result.inferredResources().stream()
                .anyMatch(r -> r.resourceType().equals("aws_vpc"));
        assertTrue(hasVpc);
    }
}
