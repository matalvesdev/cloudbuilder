package com.cloudbuilder.provision.domain.service;

import com.cloudbuilder.git.domain.model.ConnectedRepository;
import com.cloudbuilder.git.domain.model.GitPushEvent;
import com.cloudbuilder.git.domain.port.ConnectedRepositoryPort;
import com.cloudbuilder.github.infrastructure.client.GitHubApiClient;
import com.cloudbuilder.provision.domain.model.DriftReport;
import com.cloudbuilder.shared.event.domain.DriftDetectedEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PushDriftDetectorTest {

    @Mock
    private ConnectedRepositoryPort repositoryPort;

    @Mock
    private GitHubApiClient gitHubApiClient;

    @Mock
    private DriftDetectionService driftDetectionService;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    private PushDriftDetector detector;

    private ConnectedRepository sampleRepo;

    @BeforeEach
    void setUp() {
        detector = new PushDriftDetector(repositoryPort, gitHubApiClient,
                driftDetectionService, eventPublisher);
        sampleRepo = new ConnectedRepository(ConnectedRepository.Provider.GITHUB,
                "https://github.com/cloudbuilder/infra-repo", "infra-repo",
                "cloudbuilder/infra-repo", "cloudbuilder", "main", "ghp_token");
    }

    @Test
    void onGitPushDetectDrift_WithResources_ShouldDetectAndPublish() throws Exception {
        var event = new GitPushEvent("repo-1", List.of(), "main");
        when(repositoryPort.findById("repo-1")).thenReturn(Optional.of(sampleRepo));

        var mainTf = new GitHubApiClient.GitHubFile("main.tf", "main.tf", "file", "sha1", 100L);
        when(gitHubApiClient.listContents(anyString(), anyString(), anyString(),
                eq(""), eq("main"))).thenReturn(List.of(mainTf));
        when(gitHubApiClient.getFileContent(anyString(), anyString(), anyString(),
                eq("main.tf"), eq("main")))
                .thenReturn("resource \"aws_vpc\" \"main\" {}");

        var driftReport = new DriftReport("repo-1",
                "[{\"resource\":\"aws_vpc.main\",\"status\":\"drifted\"}]");
        when(driftDetectionService.detectDrift(anyString(), anyString())).thenReturn(driftReport);

        detector.onGitPushDetectDrift(event);

        verify(driftDetectionService).detectDrift(eq("repo-1"), anyString());
        verify(eventPublisher).publishEvent(any(DriftDetectedEvent.class));
    }

    @Test
    void onGitPushDetectDrift_NoTfFiles_ShouldSkip() throws Exception {
        var event = new GitPushEvent("repo-1", List.of(), "main");
        when(repositoryPort.findById("repo-1")).thenReturn(Optional.of(sampleRepo));
        when(gitHubApiClient.listContents(anyString(), anyString(), anyString(),
                eq(""), eq("main"))).thenReturn(List.of());

        detector.onGitPushDetectDrift(event);

        verify(driftDetectionService, never()).detectDrift(anyString(), anyString());
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    void onGitPushDetectDrift_RepoNotFound_ShouldSkip() {
        var event = new GitPushEvent("nonexistent", List.of(), "main");
        when(repositoryPort.findById("nonexistent")).thenReturn(Optional.empty());

        detector.onGitPushDetectDrift(event);

        verifyNoInteractions(gitHubApiClient);
        verifyNoInteractions(driftDetectionService);
    }

    @Test
    void onGitPushDetectDrift_NoToken_ShouldSkip() {
        var noTokenRepo = new ConnectedRepository(ConnectedRepository.Provider.GITHUB,
                "https://github.com/cb/no-token", "no-token",
                "cb/no-token", "cb", "main", null);
        var event = new GitPushEvent("repo-2", List.of(), "main");
        when(repositoryPort.findById("repo-2")).thenReturn(Optional.of(noTokenRepo));

        detector.onGitPushDetectDrift(event);

        verifyNoInteractions(gitHubApiClient);
        verifyNoInteractions(driftDetectionService);
        verifyNoInteractions(eventPublisher);
    }

    @Test
    void onGitPushDetectDrift_WithCleanState_ShouldPublishEvent() throws Exception {
        var event = new GitPushEvent("repo-1", List.of(), "main");
        when(repositoryPort.findById("repo-1")).thenReturn(Optional.of(sampleRepo));

        var mainTf = new GitHubApiClient.GitHubFile("main.tf", "main.tf", "file", "s1", 50L);
        when(gitHubApiClient.listContents(anyString(), anyString(), anyString(),
                eq(""), eq("main"))).thenReturn(List.of(mainTf));
        when(gitHubApiClient.getFileContent(anyString(), anyString(), anyString(),
                eq("main.tf"), eq("main")))
                .thenReturn("resource \"aws_vpc\" \"main\" {}");

        var cleanReport = new DriftReport("repo-1", "[]");
        when(driftDetectionService.detectDrift(anyString(), anyString())).thenReturn(cleanReport);

        detector.onGitPushDetectDrift(event);

        verify(eventPublisher).publishEvent(any(DriftDetectedEvent.class));
    }
}
