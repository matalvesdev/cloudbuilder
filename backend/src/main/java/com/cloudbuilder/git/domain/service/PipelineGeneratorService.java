package com.cloudbuilder.git.domain.service;

import com.cloudbuilder.git.domain.model.AppDetection;
import org.springframework.stereotype.Service;

@Service
public class PipelineGeneratorService {

    private static final String INDENT = "  ";

    public String generateGithubActions(AppDetection detection) {
        String language = detection.getLanguage() != null ? detection.getLanguage() : "unknown";
        String setupStep = getSetupStep(language);
        String buildStep = getBuildStep(language);
        String testStep = getTestStep(language);
        String dockerStep = detection.isHasDockerfile() ? getDockerBuildStep() : "";
        String k8sStep = detection.isHasKubernetesManifest() ? getK8sDeployStep() : "";

        return """
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
%s
%s
%s
%s
%s""" .formatted(
                indent(setupStep, 2),
                indent(buildStep, 2),
                indent(testStep, 2),
                indent(dockerStep, 2),
                indent(k8sStep, 2)
        ).trim();
    }

    public String generateGitlabCi(AppDetection detection) {
        String language = detection.getLanguage() != null ? detection.getLanguage() : "unknown";
        String dockerStage = detection.isHasDockerfile() ? """
  - build-image
  - push-image
""" : "";
        String k8sStage = detection.isHasKubernetesManifest() ? """
  - deploy
""" : "";

        return """
stages:
  - build
  - test%s%s

variables:
  DOCKER_DRIVER: overlay2

%s
%s
%s
%s""" .formatted(
                dockerStage.replace("\n", "").replace("  ", ""),
                k8sStage.replace("\n", "").replace("  ", ""),
                indent(getGitlabBuildJob(language), 1),
                indent(getGitlabTestJob(language), 1),
                indent(getGitlabDockerJob(language, detection), 1),
                indent(getGitlabDeployJob(detection), 1)
        ).trim();
    }

    private String getSetupStep(String language) {
        return switch (language) {
            case "Java", "Kotlin" -> """
- name: Set up JDK 21
  uses: actions/setup-java@v4
  with:
    java-version: '21'
    distribution: 'temurin'
    cache: maven""";
            case "TypeScript", "JavaScript" -> """
- name: Set up Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'""";
            case "Python" -> """
- name: Set up Python
  uses: actions/setup-python@v5
  with:
    python-version: '3.12'
    cache: 'pip'""";
            case "Go" -> """
- name: Set up Go
  uses: actions/setup-go@v5
  with:
    go-version: '1.22'
    cache: true""";
            default -> """
- name: Checkout code
  uses: actions/checkout@v4""";
        };
    }

    private String getBuildStep(String language) {
        return switch (language) {
            case "Java", "Kotlin" -> "- name: Build with Maven\n  run: mvn -B clean package -DskipTests";
            case "TypeScript", "JavaScript" -> "- name: Install dependencies\n  run: npm ci\n- name: Build\n  run: npm run build";
            case "Python" -> "- name: Install dependencies\n  run: pip install -r requirements.txt";
            case "Go" -> "- name: Build\n  run: go build -o app ./cmd/...";
            default -> "- name: Build\n  run: echo 'Build step not configured'";
        };
    }

    private String getTestStep(String language) {
        return switch (language) {
            case "Java", "Kotlin" -> "- name: Run tests\n  run: mvn -B test";
            case "TypeScript", "JavaScript" -> "- name: Run tests\n  run: npm test";
            case "Python" -> "- name: Run tests\n  run: pytest";
            case "Go" -> "- name: Run tests\n  run: go test ./... -v -race";
            default -> "- name: Test\n  run: echo 'No test step configured'";
        };
    }

    private String getDockerBuildStep() {
        return """
- name: Set up Docker Buildx
  uses: docker/setup-buildx-action@v3
- name: Login to Container Registry
  uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}
- name: Build and push Docker image
  uses: docker/build-push-action@v6
  with:
    context: .
    push: true
    tags: ghcr.io/${{ github.repository }}:${{ github.sha }}""";
    }

    private String getK8sDeployStep() {
        return """
- name: Deploy to Kubernetes
  run: |
    kubectl set image deployment/app app=ghcr.io/${{ github.repository }}:${{ github.sha }}
    kubectl rollout status deployment/app""";
    }

    private String getGitlabBuildJob(String language) {
        return switch (language) {
            case "Java", "Kotlin" -> """
build:
  stage: build
  image: eclipse-temurin:21-jdk
  script:
    - ./mvnw -B clean package -DskipTests
  artifacts:
    paths:
      - target/*.jar""";
            case "TypeScript", "JavaScript" -> """
build:
  stage: build
  image: node:20
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/""";
            case "Python" -> """
build:
  stage: build
  image: python:3.12
  script:
    - pip install -r requirements.txt""";
            case "Go" -> """
build:
  stage: build
  image: golang:1.22
  script:
    - go build -o app ./cmd/...""";
            default -> """
build:
  stage: build
  image: alpine:latest
  script:
    - echo 'Build step not configured'""";
        };
    }

    private String getGitlabTestJob(String language) {
        return switch (language) {
            case "Java", "Kotlin" -> """
test:
  stage: test
  image: eclipse-temurin:21-jdk
  script:
    - ./mvnw -B test""";
            case "TypeScript", "JavaScript" -> """
test:
  stage: test
  image: node:20
  script:
    - npm test""";
            case "Python" -> """
test:
  stage: test
  image: python:3.12
  script:
    - pytest""";
            case "Go" -> """
test:
  stage: test
  image: golang:1.22
  script:
    - go test ./... -v -race""";
            default -> """
test:
  stage: test
  image: alpine:latest
  script:
    - echo 'No test step configured'""";
        };
    }

    private String getGitlabDockerJob(String language, AppDetection detection) {
        if (!detection.isHasDockerfile()) {
            return "";
        }
        return """
build-image:
  stage: build-image
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA""";
    }

    private String getGitlabDeployJob(AppDetection detection) {
        if (!detection.isHasKubernetesManifest()) {
            return "";
        }
        return """
deploy:
  stage: deploy
  image: bitnami/kubectl:latest
  script:
    - kubectl set image deployment/app app=$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
    - kubectl rollout status deployment/app
  only:
    - main""";
    }

    private String indent(String block, int level) {
        if (block == null || block.isBlank()) {
            return "";
        }
        String prefix = INDENT.repeat(level);
        return block.lines()
                .map(line -> line.isBlank() ? "" : prefix + line)
                .reduce((a, b) -> a + "\n" + b)
                .orElse("");
    }
}
