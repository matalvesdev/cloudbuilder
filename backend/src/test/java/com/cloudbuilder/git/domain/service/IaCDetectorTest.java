package com.cloudbuilder.git.domain.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class IaCDetectorTest {

    private IaCDetector detector;

    @BeforeEach
    void setUp() {
        detector = new IaCDetector();
    }

    @Test
    void detectTerraform_WithTfFiles_ShouldReturnMatching() {
        var files = List.of("main.tf", "variables.tf", "outputs.tf", "README.md", "app.js");
        var result = detector.detectTerraform(files);
        assertEquals(3, result.size());
        assertTrue(result.contains("main.tf"));
        assertTrue(result.contains("variables.tf"));
        assertTrue(result.contains("outputs.tf"));
    }

    @Test
    void detectTerraform_WithTfState_ShouldReturnMatching() {
        var files = List.of("terraform.tfstate", "terraform.tfvars", "app.js");
        var result = detector.detectTerraform(files);
        assertEquals(2, result.size());
        assertTrue(result.contains("terraform.tfstate"));
        assertTrue(result.contains("terraform.tfvars"));
    }

    @Test
    void detectTerraform_WithNoTfFiles_ShouldReturnEmpty() {
        var files = List.of("app.js", "Dockerfile", "README.md");
        assertTrue(detector.detectTerraform(files).isEmpty());
    }

    @Test
    void detectKubernetes_WithK8sFiles_ShouldReturnMatching() {
        var files = List.of("deployment.yaml", "service.yaml", "ingress.yaml", "main.tf", "README.md");
        var result = detector.detectKubernetes(files);
        assertFalse(result.isEmpty());
        assertTrue(result.contains("deployment.yaml"));
        assertTrue(result.contains("service.yaml"));
    }

    @Test
    void detectKubernetes_ShouldExcludeTerraformFiles() {
        var files = List.of("main.tf", "deployment.yaml");
        var result = detector.detectKubernetes(files);
        assertFalse(result.contains("main.tf"));
        assertTrue(result.contains("deployment.yaml"));
    }

    @Test
    void detectDockerFiles_WithDockerfile_ShouldReturnMatching() {
        var files = List.of("Dockerfile", "docker-compose.yml", "README.md");
        var result = detector.detectDockerFiles(files);
        assertEquals(2, result.size());
        assertTrue(result.contains("Dockerfile"));
        assertTrue(result.contains("docker-compose.yml"));
    }

    @Test
    void detectDockerFiles_WithDockerfileExtension_ShouldReturnMatching() {
        var files = List.of("api.Dockerfile", "web.dockerfile", "app.js");
        var result = detector.detectDockerFiles(files);
        assertEquals(2, result.size());
    }

    @Test
    void detectAppType_JavaWithDocker_ShouldReturnContainerizedBackend() {
        var files = List.of("pom.xml", "Dockerfile", "src/main/java/App.java");
        var result = detector.detectAppType(files);
        assertEquals("Containerized Backend Service", result.getAppType());
        assertEquals("Java", result.getLanguage());
        assertTrue(result.isHasDockerfile());
    }

    @Test
    void detectAppType_TypeScriptReact_ShouldReturnFrontend() {
        var files = List.of("package.json", "tsconfig.json", "src/App.tsx");
        var result = detector.detectAppType(files);
        assertEquals("Frontend Application", result.getAppType());
        assertEquals("TypeScript", result.getLanguage());
    }

    @Test
    void detectAppType_PythonWithFlask_ShouldReturnBackend() {
        var files = List.of("requirements.txt", "app.py");
        var result = detector.detectAppType(files);
        assertEquals("Backend Service", result.getAppType());
        assertEquals("Python", result.getLanguage());
    }

    @Test
    void detectAppType_Go_ShouldReturnBackend() {
        var files = List.of("main.go", "go.mod");
        var result = detector.detectAppType(files);
        assertEquals("Backend Service", result.getAppType());
        assertEquals("Go", result.getLanguage());
    }

    @Test
    void detectAppType_Unknown_ShouldReturnUnknown() {
        var files = List.of("README.md", "LICENSE");
        var result = detector.detectAppType(files);
        assertEquals("Unknown Application", result.getAppType());
        assertEquals("Unknown", result.getLanguage());
    }

    @Test
    void detectAppType_WithK8s_ShouldSetHasK8s() {
        var files = List.of("pom.xml", "deployment.yaml", "service.yaml");
        var result = detector.detectAppType(files);
        assertTrue(result.isHasKubernetesManifest());
    }

    @Test
    void detectLanguage_Java_ShouldReturnJava() {
        var files = List.of("src/main/java/App.java", "pom.xml");
        var result = detector.detectAppType(files);
        assertEquals("Java", result.getLanguage());
        assertEquals("Spring Boot", result.getFramework());
    }

    @Test
    void detectLanguage_TypeScript_ShouldReturnTypeScript() {
        var files = List.of("src/App.tsx", "package.json");
        var result = detector.detectAppType(files);
        assertEquals("TypeScript", result.getLanguage());
    }
}
