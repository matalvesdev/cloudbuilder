package com.cloudbuilder.observe.domain.service;

import com.cloudbuilder.git.domain.model.ConnectedRepository;
import com.cloudbuilder.git.domain.model.GitPushEvent;
import com.cloudbuilder.git.domain.port.ConnectedRepositoryPort;
import com.cloudbuilder.github.infrastructure.client.GitHubApiClient;
import com.cloudbuilder.observe.domain.model.ServiceHealth;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TerraformResourceObserverTest {

    @Mock
    private ConnectedRepositoryPort repositoryPort;

    @Mock
    private GitHubApiClient gitHubApiClient;

    @Mock
    private HealthCheckService healthCheckService;

    private TerraformResourceObserver observer;

    private ConnectedRepository sampleRepo;

    @BeforeEach
    void setUp() {
        observer = new TerraformResourceObserver(repositoryPort, gitHubApiClient, healthCheckService);
        sampleRepo = new ConnectedRepository(ConnectedRepository.Provider.GITHUB,
                "https://github.com/cloudbuilder/infra-repo", "infra-repo",
                "cloudbuilder/infra-repo", "cloudbuilder", "main", "ghp_token");
    }

    @Test
    void onGitPush_WithTerraformResources_ShouldRegisterServices() throws Exception {
        var event = new GitPushEvent("repo-1", List.of(), "main");
        when(repositoryPort.findById("repo-1")).thenReturn(Optional.of(sampleRepo));

        var mainTf = new GitHubApiClient.GitHubFile("main.tf", "main.tf", "file", "sha1", 200L);
        when(gitHubApiClient.listContents(anyString(), anyString(), anyString(),
                eq(""), eq("main"))).thenReturn(List.of(mainTf));
        when(gitHubApiClient.getFileContent(anyString(), anyString(), anyString(),
                eq("main.tf"), eq("main")))
                .thenReturn("resource \"aws_vpc\" \"main\" {}\nresource \"aws_instance\" \"web\" {}");

        when(healthCheckService.getLatestHealth(anyString(), anyString()))
                .thenReturn(Optional.empty());

        observer.onGitPush(event);

        verify(healthCheckService, times(2)).recordHealth(
                anyString(), eq("repo-1"), eq("healthy"), eq(0.0), eq(100.0));
        verify(healthCheckService).recordHealth(
                eq("VPC"), eq("repo-1"), eq("healthy"), eq(0.0), eq(100.0));
        verify(healthCheckService).recordHealth(
                eq("EC2"), eq("repo-1"), eq("healthy"), eq(0.0), eq(100.0));
    }

    @Test
    void onGitPush_WithNoTfFiles_ShouldNotRegister() throws Exception {
        var event = new GitPushEvent("repo-1", List.of(), "main");
        when(repositoryPort.findById("repo-1")).thenReturn(Optional.of(sampleRepo));
        when(gitHubApiClient.listContents(anyString(), anyString(), anyString(),
                eq(""), eq("main"))).thenReturn(List.of());

        observer.onGitPush(event);

        verifyNoInteractions(healthCheckService);
    }

    @Test
    void onGitPush_WithRecentlyRegisteredService_ShouldSkip() throws Exception {
        var event = new GitPushEvent("repo-1", List.of(), "main");
        when(repositoryPort.findById("repo-1")).thenReturn(Optional.of(sampleRepo));

        var mainTf = new GitHubApiClient.GitHubFile("main.tf", "main.tf", "file", "s1", 50L);
        when(gitHubApiClient.listContents(anyString(), anyString(), anyString(),
                eq(""), eq("main"))).thenReturn(List.of(mainTf));
        when(gitHubApiClient.getFileContent(anyString(), anyString(), anyString(),
                eq("main.tf"), eq("main")))
                .thenReturn("resource \"aws_vpc\" \"main\" {}");

        var existingHealth = new ServiceHealth("VPC", "repo-1", "healthy", 10.0, 99.9);
        when(healthCheckService.getLatestHealth("VPC", "repo-1"))
                .thenReturn(Optional.of(existingHealth));

        observer.onGitPush(event);

        verify(healthCheckService, never()).recordHealth(
                anyString(), anyString(), anyString(), anyDouble(), anyDouble());
    }

    @Test
    void onGitPush_RepoNotFound_ShouldNotRegister() {
        var event = new GitPushEvent("nonexistent", List.of(), "main");
        when(repositoryPort.findById("nonexistent")).thenReturn(Optional.empty());

        observer.onGitPush(event);

        verifyNoInteractions(gitHubApiClient);
        verifyNoInteractions(healthCheckService);
    }

    @Test
    void onGitPush_NoToken_ShouldNotRegister() {
        var noTokenRepo = new ConnectedRepository(ConnectedRepository.Provider.GITHUB,
                "https://github.com/cb/no-token", "no-token",
                "cb/no-token", "cb", "main", null);
        var event = new GitPushEvent("repo-2", List.of(), "main");
        when(repositoryPort.findById("repo-2")).thenReturn(Optional.of(noTokenRepo));

        observer.onGitPush(event);

        verifyNoInteractions(gitHubApiClient);
        verifyNoInteractions(healthCheckService);
    }
}
