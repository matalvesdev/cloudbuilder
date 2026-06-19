package com.cloudbuilder.git.domain.service;

import com.cloudbuilder.git.domain.model.AppDetection;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PipelineGeneratorServiceTest {

    private PipelineGeneratorService generator;

    @BeforeEach
    void setUp() {
        generator = new PipelineGeneratorService();
    }

    @Test
    void generateGithubActions_JavaApp_ShouldIncludeMavenSteps() {
        var detection = new AppDetection("Backend Service", "Java", "Spring Boot", true, false);
        String yaml = generator.generateGithubActions(detection);
        assertTrue(yaml.contains("setup-java"));
        assertTrue(yaml.contains("mvn -B clean package"));
        assertTrue(yaml.contains("mvn -B test"));
        assertTrue(yaml.contains("docker/setup-buildx-action"));
    }

    @Test
    void generateGithubActions_TypeScriptApp_ShouldIncludeNodeSteps() {
        var detection = new AppDetection("Frontend Application", "TypeScript", "React", false, false);
        String yaml = generator.generateGithubActions(detection);
        assertTrue(yaml.contains("setup-node"));
        assertTrue(yaml.contains("npm ci"));
        assertTrue(yaml.contains("npm run build"));
        assertTrue(yaml.contains("npm test"));
    }

    @Test
    void generateGithubActions_PythonApp_ShouldIncludePythonSteps() {
        var detection = new AppDetection("Backend Service", "Python", "FastAPI", false, false);
        String yaml = generator.generateGithubActions(detection);
        assertTrue(yaml.contains("setup-python"));
        assertTrue(yaml.contains("pip install"));
        assertTrue(yaml.contains("pytest"));
    }

    @Test
    void generateGithubActions_GoApp_ShouldIncludeGoSteps() {
        var detection = new AppDetection("Backend Service", "Go", "Go (standard library)", false, false);
        String yaml = generator.generateGithubActions(detection);
        assertTrue(yaml.contains("setup-go"));
        assertTrue(yaml.contains("go build"));
        assertTrue(yaml.contains("go test"));
    }

    @Test
    void generateGithubActions_WithDockerAndK8s_ShouldIncludeDeploySteps() {
        var detection = new AppDetection("Containerized Backend Service", "Java", "Spring Boot", true, true);
        String yaml = generator.generateGithubActions(detection);
        assertTrue(yaml.contains("docker/build-push-action"));
        assertTrue(yaml.contains("kubectl set image"));
    }

    @Test
    void generateGithubActions_WithoutDockerAndK8s_ShouldSkipDeploySteps() {
        var detection = new AppDetection("Backend Service", "Java", "Spring Boot", false, false);
        String yaml = generator.generateGithubActions(detection);
        assertFalse(yaml.contains("docker/build-push-action"));
        assertFalse(yaml.contains("kubectl set image"));
    }

    @Test
    void generateGithubActions_UnknownLanguage_ShouldUseDefaultSteps() {
        var detection = new AppDetection("Unknown Application", "Unknown", "Unknown", false, false);
        String yaml = generator.generateGithubActions(detection);
        assertTrue(yaml.contains("Build step not configured"));
    }

    @Test
    void generateGitlabCi_JavaApp_ShouldIncludeMavenJobs() {
        var detection = new AppDetection("Backend Service", "Java", "Spring Boot", true, false);
        String yaml = generator.generateGitlabCi(detection);
        assertTrue(yaml.contains("mvnw -B clean package"));
        assertTrue(yaml.contains("mvnw -B test"));
        assertTrue(yaml.contains("build-image"));
    }

    @Test
    void generateGitlabCi_WithK8s_ShouldIncludeDeployStage() {
        var detection = new AppDetection("Backend Service", "Java", "Spring Boot", true, true);
        String yaml = generator.generateGitlabCi(detection);
        assertTrue(yaml.contains("deploy"));
        assertTrue(yaml.contains("kubectl"));
    }

    @Test
    void generateGitlabCi_WithoutDocker_ShouldSkipDockerJob() {
        var detection = new AppDetection("Backend Service", "Java", "Spring Boot", false, false);
        String yaml = generator.generateGitlabCi(detection);
        assertFalse(yaml.contains("build-image"));
    }
}
