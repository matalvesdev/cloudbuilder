package com.cloudbuilder.git.domain.service;

import com.cloudbuilder.git.domain.model.AppDetection;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;
import java.util.Set;

@Component
public class IaCDetector {

    private static final Set<String> TERRAFORM_EXTENSIONS = Set.of(".tf", ".tfvars", ".tfstate");
    private static final Set<String> TERRAFORM_FILES = Set.of("main.tf", "variables.tf", "outputs.tf",
            "provider.tf", "terraform.tfvars", "versions.tf", "backend.tf");

    private static final Set<String> KUBERNETES_EXTENSIONS = Set.of(".yaml", ".yml");
    private static final Set<String> KUBERNETES_INDICATORS = Set.of("apiVersion:", "kind: Deployment",
            "kind: Service", "kind: Ingress", "kind: ConfigMap", "kind: Secret",
            "kind: StatefulSet", "kind: DaemonSet", "kind: Namespace",
            "apiVersion: apps/v1", "apiVersion: v1");

    private static final Set<String> DOCKER_FILES = Set.of("Dockerfile", "docker-compose.yml",
            "docker-compose.yaml", ".dockerignore");

    public List<String> detectTerraform(List<String> files) {
        return files.stream()
                .filter(f -> TERRAFORM_EXTENSIONS.stream().anyMatch(f::endsWith)
                        || TERRAFORM_FILES.contains(f))
                .toList();
    }

    public List<String> detectKubernetes(List<String> files) {
        return files.stream()
                .filter(f -> KUBERNETES_EXTENSIONS.stream().anyMatch(f::endsWith))
                .filter(f -> !detectTerraform(List.of(f)).isEmpty() == false)
                .filter(f -> isKubernetesFile(f))
                .toList();
    }

    public List<String> detectDockerFiles(List<String> files) {
        return files.stream()
                .filter(f -> DOCKER_FILES.contains(f) || f.toLowerCase().endsWith(".dockerfile"))
                .toList();
    }

    public AppDetection detectAppType(List<String> files) {
        String language = detectLanguage(files);
        String framework = detectFramework(files, language);
        boolean hasDockerfile = !detectDockerFiles(files).isEmpty();
        boolean hasK8s = !detectKubernetes(files).isEmpty();
        String appType = classifyAppType(language, framework, hasDockerfile);

        return new AppDetection(appType, language, framework, hasDockerfile, hasK8s);
    }

    private boolean isKubernetesFile(String filename) {
        String lower = filename.toLowerCase();
        return lower.contains("deployment") || lower.contains("service")
                || lower.contains("ingress") || lower.contains("configmap")
                || lower.contains("kustomization") || lower.contains("helm")
                || lower.contains("k8s") || lower.contains("kubernetes");
    }

    private String detectLanguage(List<String> files) {
        for (String file : files) {
            String lower = file.toLowerCase();
            if (lower.endsWith(".java")) return "Java";
            if (lower.endsWith(".ts") || lower.endsWith(".tsx")) return "TypeScript";
            if (lower.endsWith(".js") || lower.endsWith(".jsx")) return "JavaScript";
            if (lower.endsWith(".py")) return "Python";
            if (lower.endsWith(".go")) return "Go";
            if (lower.endsWith(".rs")) return "Rust";
            if (lower.endsWith(".rb")) return "Ruby";
            if (lower.endsWith(".cs")) return "C#";
            if (lower.endsWith(".php")) return "PHP";
            if (lower.endsWith(".swift")) return "Swift";
            if (lower.endsWith(".kt")) return "Kotlin";
            if (lower.equals("cargo.toml") || lower.equals("gomod") || lower.equals("go.sum")) {
                return "Go";
            }
            if (lower.equals("package.json") || lower.equals("tsconfig.json")) return "TypeScript";
            if (lower.equals("pom.xml") || lower.equals("build.gradle") || lower.equals("build.gradle.kts")) return "Java";
            if (lower.equals("requirements.txt") || lower.equals("pyproject.toml") || lower.equals("setup.py")) return "Python";
        }
        return "Unknown";
    }

    private String detectFramework(List<String> files, String language) {
        for (String file : files) {
            String lower = file.toLowerCase();
            if (language.equals("Java") || language.equals("Kotlin")) {
                if (lower.contains("spring") || lower.equals("pom.xml")) return "Spring Boot";
                if (lower.contains("quarkus")) return "Quarkus";
                if (lower.contains("micronaut")) return "Micronaut";
            }
            if (language.equals("TypeScript") || language.equals("JavaScript")) {
                if (lower.contains("angular") || lower.contains("angular.json")) return "Angular";
                if (lower.contains("next") || lower.contains("next.config")) return "Next.js";
                if (lower.contains("nuxt") || lower.contains("nuxt.config")) return "Nuxt.js";
                if (lower.contains("react") || lower.equals("vite.config.ts") || lower.equals("vite.config.js")) return "React";
                if (lower.contains("vue")) return "Vue.js";
                if (lower.contains("svelte")) return "Svelte";
                if (lower.contains("express")) return "Express";
                if (lower.contains("nest") || lower.contains("nest.js")) return "NestJS";
            }
            if (language.equals("Python")) {
                if (lower.contains("django") || lower.contains("manage.py") || lower.contains("wsgi.py")) return "Django";
                if (lower.contains("flask")) return "Flask";
                if (lower.contains("fastapi")) return "FastAPI";
            }
            if (language.equals("Go")) {
                if (lower.contains("gin")) return "Gin";
                if (lower.contains("echo")) return "Echo";
                if (lower.contains("fiber")) return "Fiber";
            }
        }
        return switch (language) {
            case "Java" -> "Spring Boot";
            case "TypeScript", "JavaScript" -> "React";
            case "Python" -> "FastAPI";
            case "Go" -> "Go (standard library)";
            default -> "Unknown";
        };
    }

    private String classifyAppType(String language, String framework, boolean hasDockerfile) {
        if ("Java".equals(language) || "Kotlin".equals(language)) {
            if (hasDockerfile) return "Containerized Backend Service";
            return "Backend Service";
        }
        if ("TypeScript".equals(language)) {
            if (framework != null && (framework.contains("Next") || framework.contains("Nuxt"))) return "Full-Stack Application";
            if (framework != null && (framework.contains("React") || framework.contains("Vue") || framework.contains("Angular"))) return "Frontend Application";
            if (framework != null && (framework.contains("Nest") || framework.contains("Express"))) return "Backend Service";
            return "Web Application";
        }
        if ("Python".equals(language)) return "Backend Service";
        if ("Go".equals(language)) return "Backend Service";
        if (hasDockerfile) return "Containerized Application";
        return "Unknown Application";
    }
}
