package com.cloudbuilder.github.infrastructure.web;

import com.cloudbuilder.github.application.dto.*;
import com.cloudbuilder.github.domain.service.GitHubOAuthService;
import com.cloudbuilder.github.infrastructure.client.GitHubApiClient;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/github")
@PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'VIEWER')")
public class GitHubController {

    private final GitHubOAuthService oauthService;
    private final GitHubApiClient apiClient;

    public GitHubController(GitHubOAuthService oauthService, GitHubApiClient apiClient) {
        this.oauthService = oauthService;
        this.apiClient = apiClient;
    }

    /**
     * GET /api/v1/github/auth - Get OAuth authorization URL
     */
    @GetMapping("/auth")
    public ResponseEntity<GitHubAuthResponse> getAuthUrl(HttpSession session) {
        String state = UUID.randomUUID().toString().toString();
        session.setAttribute("github_oauth_state", state);
        String authorizeUrl = oauthService.buildAuthorizationUrl(state);
        return ResponseEntity.ok(new GitHubAuthResponse(authorizeUrl, oauthService.isConfigured()));
    }

    /**
     * GET /api/v1/github/callback - OAuth callback from GitHub
     */
    @GetMapping("/callback")
    public ResponseEntity<GitHubCallbackResponse> callback(
            @RequestParam("code") String code,
            @RequestParam(value = "state", required = false) String state,
            HttpSession session) {

        // Verify state matches (CSRF protection)
        String savedState = (String) session.getAttribute("github_oauth_state");
        if (savedState != null && !savedState.equals(state)) {
            return ResponseEntity.badRequest()
                .body(new GitHubCallbackResponse(null, "State mismatch. Tente novamente."));
        }

        try {
            String token = oauthService.exchangeCode(code);
            session.setAttribute("github_token", token);
            // Redirect back to frontend with success
            return ResponseEntity.ok(new GitHubCallbackResponse(token, "Autenticado com sucesso!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(new GitHubCallbackResponse(null, "Erro na autenticação: " + e.getMessage()));
        }
    }

    /**
     * GET /api/v1/github/repos - List authenticated user's repositories
     */
    @GetMapping("/repos")
    public ResponseEntity<GitHubRepoListResponse> listRepos(HttpSession session) {
        String token = getToken(session);
        if (token == null) {
            return ResponseEntity.status(401).body(new GitHubRepoListResponse(List.of()));
        }

        try {
            var repos = apiClient.listRepositories(token);
            var items = repos.stream()
                .map(r -> new GitHubRepoListResponse.RepoItem(
                    r.id(), r.fullName(), r.name(), r.owner(),
                    r.description(), r.defaultBranch(), r.language(),
                    r.isPrivate(), r.updatedAt(), r.htmlUrl()))
                .toList();
            return ResponseEntity.ok(new GitHubRepoListResponse(items));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(new GitHubRepoListResponse(List.of()));
        }
    }

    /**
     * GET /api/v1/github/repos/{owner}/{repo}/contents?path=...&branch=...
     * List files in a repository path.
     */
    @GetMapping("/repos/{owner}/{repo}/contents")
    public ResponseEntity<GitHubFileListResponse> listContents(
            @PathVariable String owner,
            @PathVariable String repo,
            @RequestParam(defaultValue = "") String path,
            @RequestParam(defaultValue = "main") String branch,
            HttpSession session) {

        String token = getToken(session);
        if (token == null) {
            return ResponseEntity.status(401).body(new GitHubFileListResponse(List.of()));
        }

        try {
            var files = apiClient.listContents(token, owner, repo, path, branch);
            var items = files.stream()
                .map(f -> new GitHubFileListResponse.FileItem(f.name(), f.path(), f.type(), f.sha(), f.size()))
                .toList();
            return ResponseEntity.ok(new GitHubFileListResponse(items));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(new GitHubFileListResponse(List.of()));
        }
    }

    /**
     * GET /api/v1/github/repos/{owner}/{repo}/file?path=...&branch=...
     * Get the content of a single file.
     */
    @GetMapping("/repos/{owner}/{repo}/file")
    public ResponseEntity<GitHubFileContentResponse> getFile(
            @PathVariable String owner,
            @PathVariable String repo,
            @RequestParam String path,
            @RequestParam(defaultValue = "main") String branch,
            HttpSession session) {

        String token = getToken(session);
        if (token == null) {
            return ResponseEntity.status(401).body(new GitHubFileContentResponse("", "", ""));
        }

        try {
            String content = apiClient.getFileContent(token, owner, repo, path, branch);
            String fileName = path.contains("/") ? path.substring(path.lastIndexOf('/') + 1) : path;
            return ResponseEntity.ok(new GitHubFileContentResponse(fileName, path, content));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(new GitHubFileContentResponse("", "", "Erro: " + e.getMessage()));
        }
    }

    private String getToken(HttpSession session) {
        return (String) session.getAttribute("github_token");
    }
}
