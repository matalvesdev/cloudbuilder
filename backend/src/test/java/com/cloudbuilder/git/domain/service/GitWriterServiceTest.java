package com.cloudbuilder.git.domain.service;

import com.cloudbuilder.git.application.dto.GitWriteRequest;
import com.cloudbuilder.git.domain.model.ConnectedRepository;
import com.cloudbuilder.git.domain.port.ConnectedRepositoryPort;
import com.cloudbuilder.github.infrastructure.client.GitHubApiClient;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GitWriterServiceTest {

    @Mock
    private ConnectedRepositoryPort repositoryPort;

    @Mock
    private GitHubApiClient gitHubApiClient;

    private GitWriterService gitWriterService;

    private ConnectedRepository sampleRepo;

    @BeforeEach
    void setUp() {
        gitWriterService = new GitWriterService(repositoryPort, gitHubApiClient);
        sampleRepo = new ConnectedRepository(ConnectedRepository.Provider.GITHUB,
                "https://github.com/cloudbuilder/infra-repo", "infra-repo",
                "cloudbuilder/infra-repo", "cloudbuilder", "main", "ghp_fake123token");
    }

    @Test
    void writeFiles_DirectCommit_ShouldWriteToDefaultBranch() throws Exception {
        var request = new GitWriteRequest("repo-1", Map.of("main.tf", "resource \"aws_vpc\" \"main\" {}"),
                null, "feat: add VPC", false, null, null, "env-1");
        when(repositoryPort.findById("repo-1")).thenReturn(Optional.of(sampleRepo));
        when(gitHubApiClient.getFileSha(anyString(), anyString(), anyString(), anyString(), anyString()))
                .thenReturn(null);
        var nodeFactory = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance;
        when(gitHubApiClient.createOrUpdateFile(anyString(), anyString(), anyString(),
                anyString(), anyString(), anyString(), anyString(), isNull()))
                .thenReturn(nodeFactory.objectNode());

        var response = gitWriterService.writeFiles(request);

        assertNotNull(response);
        assertEquals("SUCCESS", response.getStatus());
        assertEquals(1, response.getFilesWritten().size());
        assertTrue(response.getFilesWritten().contains("main.tf"));
        verify(gitHubApiClient).createOrUpdateFile(anyString(), anyString(), anyString(),
                eq("main.tf"), anyString(), anyString(), eq("main"), isNull());
    }

    @Test
    void writeFiles_WithPR_ShouldCreateBranchAndPR() throws Exception {
        var request = new GitWriteRequest("repo-1", Map.of("main.tf", "resource \"aws_vpc\" \"main\" {}"),
                "cloudbuilder/abc123", "feat: add VPC", true, "PR Title", "PR Body", "env-1");
        when(repositoryPort.findById("repo-1")).thenReturn(Optional.of(sampleRepo));
        when(gitHubApiClient.getDefaultBranchSha(anyString(), anyString(), anyString()))
                .thenReturn("abc123def");
        var nodeFactory = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance;
        doNothing().when(gitHubApiClient).createBranch(anyString(), anyString(), anyString(),
                anyString(), anyString());
        when(gitHubApiClient.getFileSha(anyString(), anyString(), anyString(), anyString(), anyString()))
                .thenReturn(null);
        when(gitHubApiClient.createOrUpdateFile(anyString(), anyString(), anyString(),
                anyString(), anyString(), anyString(), anyString(), isNull()))
                .thenReturn(nodeFactory.objectNode());
        var prNode = JsonNodeFactory.instance.objectNode()
                .put("html_url", "https://github.com/cloudbuilder/infra-repo/pull/1")
                .put("number", 1);
        when(gitHubApiClient.createPullRequest(anyString(), anyString(), anyString(),
                anyString(), anyString(), anyString(), anyString()))
                .thenReturn(prNode);

        var response = gitWriterService.writeFiles(request);

        assertNotNull(response);
        assertEquals("PR_CREATED", response.getStatus());
        assertTrue(response.getPullRequestUrl().contains("pull/1"));
        assertEquals(1, response.getPullRequestNumber());
        verify(gitHubApiClient).createBranch(anyString(), anyString(), anyString(),
                anyString(), eq("abc123def"));
        verify(gitHubApiClient).createPullRequest(anyString(), anyString(), anyString(),
                anyString(), anyString(), anyString(), eq("main"));
    }

    @Test
    void writeFiles_RepoNotFound_ShouldThrow() {
        var request = new GitWriteRequest("nonexistent", Map.of("main.tf", ""),
                null, "msg", false, null, null, "env-1");
        when(repositoryPort.findById("nonexistent")).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> gitWriterService.writeFiles(request));
    }

    @Test
    void writeFiles_NoToken_ShouldReturnError() {
        var noTokenRepo = new ConnectedRepository(ConnectedRepository.Provider.GITHUB,
                "https://github.com/owner/repo", "repo",
                "owner/repo", "owner", "main", null);
        var request = new GitWriteRequest("repo-2", Map.of("main.tf", ""),
                null, "msg", false, null, null, "env-1");
        when(repositoryPort.findById("repo-2")).thenReturn(Optional.of(noTokenRepo));

        var response = gitWriterService.writeFiles(request);

        assertEquals("ERROR", response.getStatus());
        assertTrue(response.getMessage().contains("Token"));
    }

    @Test
    void writeFiles_APIError_ShouldReturnError() throws Exception {
        var request = new GitWriteRequest("repo-1", Map.of("main.tf", "content"),
                null, "msg", false, null, null, "env-1");
        when(repositoryPort.findById("repo-1")).thenReturn(Optional.of(sampleRepo));
        when(gitHubApiClient.getFileSha(anyString(), anyString(), anyString(), anyString(), anyString()))
                .thenThrow(new RuntimeException("API Error"));

        var response = gitWriterService.writeFiles(request);

        assertEquals("ERROR", response.getStatus());
        assertTrue(response.getMessage().contains("API Error"));
    }
}
