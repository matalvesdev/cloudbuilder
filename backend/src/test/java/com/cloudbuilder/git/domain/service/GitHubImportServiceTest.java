package com.cloudbuilder.git.domain.service;

import com.cloudbuilder.git.domain.model.ConnectedRepository;
import com.cloudbuilder.git.domain.port.ConnectedRepositoryPort;
import com.cloudbuilder.github.infrastructure.client.GitHubApiClient;
import com.cloudbuilder.provision.application.dto.ImportTerraformResponse;
import com.cloudbuilder.provision.application.dto.ParsedConnection;
import com.cloudbuilder.provision.application.dto.ParsedResource;
import com.cloudbuilder.provision.domain.service.TerraformImportService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GitHubImportServiceTest {

    @Mock
    private ConnectedRepositoryPort repositoryPort;

    @Mock
    private GitHubApiClient gitHubApiClient;

    @Mock
    private TerraformImportService terraformImportService;

    private GitHubImportService importService;

    private ConnectedRepository sampleRepo;

    @BeforeEach
    void setUp() {
        importService = new GitHubImportService(repositoryPort, gitHubApiClient, terraformImportService);
        sampleRepo = new ConnectedRepository(ConnectedRepository.Provider.GITHUB,
                "https://github.com/cloudbuilder/infra-repo", "infra-repo",
                "cloudbuilder/infra-repo", "cloudbuilder", "main", "ghp_fake_token");
    }

    @Test
    void importFromGitHub_WithValidRepo_ShouldReturnParsedResources() throws Exception {
        when(repositoryPort.findById("repo-1")).thenReturn(Optional.of(sampleRepo));

        var fileItem = new GitHubApiClient.GitHubFile("main.tf", "main.tf", "file", "sha1", 100L);
        when(gitHubApiClient.listContents(anyString(), anyString(), anyString(),
                eq(""), anyString())).thenReturn(List.of(fileItem));
        when(gitHubApiClient.getFileContent(anyString(), anyString(), anyString(),
                eq("main.tf"), anyString())).thenReturn("resource \"aws_vpc\" \"main\" {}");

        var parsedResource = new ParsedResource("vpc", "aws_vpc", "aws", "VPC", false, Map.of());
        var importResponse = new ImportTerraformResponse(
                List.of(parsedResource), List.of(), List.of(), 1);
        when(terraformImportService.parse(anyString())).thenReturn(importResponse);

        var result = importService.importFromGitHub("repo-1", "", null);

        assertNotNull(result);
        assertTrue(result.isSuccess());
        assertEquals(1, result.resources().size());
        assertEquals("aws_vpc", result.resources().get(0).resourceType());
        assertEquals(1, result.designNodes().size());
        verify(gitHubApiClient).listContents(anyString(), anyString(), anyString(), eq(""), eq("main"));
    }

    @Test
    void importFromGitHub_WithSubdirectory_ShouldUseCustomPath() throws Exception {
        var devRepo = new ConnectedRepository(ConnectedRepository.Provider.GITHUB,
                "https://github.com/cb/infra", "infra",
                "cb/infra", "cb", "develop", "token");
        when(repositoryPort.findById("repo-2")).thenReturn(Optional.of(devRepo));

        when(gitHubApiClient.listContents(anyString(), anyString(), anyString(),
                eq("terraform"), eq("develop"))).thenReturn(List.of());

        var result = importService.importFromGitHub("repo-2", "terraform", null);

        assertNotNull(result);
        assertFalse(result.isSuccess());
        assertTrue(result.warnings().stream().anyMatch(w -> w.contains("Nenhum")));
        verify(gitHubApiClient).listContents(anyString(), anyString(), anyString(), eq("terraform"), eq("develop"));
    }

    @Test
    void importFromGitHub_RepoNotFound_ShouldThrow() {
        when(repositoryPort.findById("nonexistent")).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> importService.importFromGitHub("nonexistent", "", null));
    }

    @Test
    void importFromGitHub_NoToken_ShouldReturnError() {
        var noTokenRepo = new ConnectedRepository(ConnectedRepository.Provider.GITHUB,
                "https://github.com/owner/repo", "repo",
                "owner/repo", "owner", "main", null);
        when(repositoryPort.findById("no-token-repo")).thenReturn(Optional.of(noTokenRepo));

        var result = importService.importFromGitHub("no-token-repo", "", null);

        assertFalse(result.isSuccess());
        assertTrue(result.warnings().stream().anyMatch(w -> w.contains("Token")));
    }

    @Test
    void importFromGitHub_WithConnections_ShouldBuildEdges() throws Exception {
        when(repositoryPort.findById("repo-1")).thenReturn(Optional.of(sampleRepo));

        var mainTf = new GitHubApiClient.GitHubFile("main.tf", "main.tf", "file", "s1", 50L);
        when(gitHubApiClient.listContents(anyString(), anyString(), anyString(),
                eq(""), anyString())).thenReturn(List.of(mainTf));
        when(gitHubApiClient.getFileContent(anyString(), anyString(), anyString(),
                eq("main.tf"), anyString()))
                .thenReturn("resource \"aws_vpc\" \"main\" {}\nresource \"aws_subnet\" \"public\" {}");

        var vpc = new ParsedResource("main", "aws_vpc", "aws", "VPC", false, Map.of());
        var subnet = new ParsedResource("public", "aws_subnet", "aws", "Subnet", false, Map.of());
        var conn = new ParsedConnection("aws_vpc.main", "aws_subnet.public");
        var importResponse = new ImportTerraformResponse(
                List.of(vpc, subnet), List.of(conn), List.of(), 2);
        when(terraformImportService.parse(anyString())).thenReturn(importResponse);

        var result = importService.importFromGitHub("repo-1", "", null);

        assertEquals(2, result.resources().size());
        assertEquals(2, result.designNodes().size());
        assertEquals(1, result.designEdges().size());
    }

    @Test
    void importFromGitHub_WithTfvars_ShouldFetchDotTfVarsFiles() throws Exception {
        when(repositoryPort.findById("repo-1")).thenReturn(Optional.of(sampleRepo));

        var tfVarsItem = new GitHubApiClient.GitHubFile("variables.tfvars", "variables.tfvars", "file", "s1", 30L);
        when(gitHubApiClient.listContents(anyString(), anyString(), anyString(),
                eq(""), anyString())).thenReturn(List.of(tfVarsItem));
        when(gitHubApiClient.getFileContent(anyString(), anyString(), anyString(),
                eq("variables.tfvars"), anyString())).thenReturn("key = \"value\"");
        when(terraformImportService.parse(anyString()))
                .thenReturn(new ImportTerraformResponse(List.of(), List.of(), List.of(), 0));

        var result = importService.importFromGitHub("repo-1", "", null);

        assertNotNull(result);
        assertTrue(result.fileContents().containsKey("variables.tfvars"));
    }
}
