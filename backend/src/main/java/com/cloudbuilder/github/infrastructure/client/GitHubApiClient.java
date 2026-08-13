package com.cloudbuilder.github.infrastructure.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.*;
import java.util.LinkedHashMap;

/**
 * HTTP client for the GitHub REST API.
 *
 * Uses java.net.http.HttpClient for zero-dependency HTTP calls.
 * All requests are authenticated via Bearer token.
 *
 * Spec: https://docs.github.com/en/rest
 */
@Component
public class GitHubApiClient {

    private static final Logger log = LoggerFactory.getLogger(GitHubApiClient.class);
    private static final String API_BASE = "https://api.github.com";
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private final HttpClient httpClient;

    public GitHubApiClient() {
        this.httpClient = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();
    }

    /**
     * Fetch all repositories for the authenticated user.
     */
    @CircuitBreaker(name = "gitHubClient", fallbackMethod = "listRepositoriesFallback")
    public List<GitHubRepo> listRepositories(String token) throws Exception {
        String json = get("/user/repos?per_page=100&sort=updated", token);
        JsonNode arr = MAPPER.readTree(json);
        List<GitHubRepo> repos = new ArrayList<>();

        for (JsonNode node : arr) {
            repos.add(new GitHubRepo(
                node.get("id").asLong(),
                node.get("full_name").asText(),
                node.get("name").asText(),
                node.get("owner").get("login").asText(),
                node.get("description").isNull() ? "" : node.get("description").asText(),
                node.get("default_branch").asText(),
                node.get("language").isNull() ? "" : node.get("language").asText(),
                node.get("private").asBoolean(),
                node.get("updated_at").asText(),
                node.get("html_url").asText()
            ));
        }

        return repos;
    }

    /**
     * Fallback when circuit breaker is OPEN for listRepositories.
     */
    public List<GitHubRepo> listRepositoriesFallback(String token, Exception ex) {
        log.warn("Circuit breaker OPEN for GitHub listRepositories: {}", ex.getMessage());
        return Collections.emptyList();
    }

    /**
     * List files and directories in a repository path.
     */
    @CircuitBreaker(name = "gitHubClient", fallbackMethod = "listContentsFallback")
    public List<GitHubFile> listContents(String token, String owner, String repo, String path, String branch) throws Exception {
        String encodedPath = path.isEmpty() ? "" : "/" + path;
        String url = "/repos/" + owner + "/" + repo + "/contents" + encodedPath + "?ref=" + branch;
        String json = get(url, token);

        JsonNode arr = MAPPER.readTree(json);
        if (!arr.isArray()) {
            // Single file
            return List.of(parseFileNode(arr));
        }

        List<GitHubFile> files = new ArrayList<>();
        for (JsonNode node : arr) {
            files.add(parseFileNode(node));
        }
        return files;
    }

    /**
     * Fallback when circuit breaker is OPEN for listContents.
     */
    public List<GitHubFile> listContentsFallback(String token, String owner, String repo, String path, String branch, Exception ex) {
        log.warn("Circuit breaker OPEN for GitHub listContents: {}", ex.getMessage());
        return Collections.emptyList();
    }

    /**
     * Get the content of a single file (decoded from base64).
     */
    @CircuitBreaker(name = "gitHubClient", fallbackMethod = "getFileContentFallback")
    public String getFileContent(String token, String owner, String repo, String path, String branch) throws Exception {
        String encodedPath = "/" + path;
        String url = "/repos/" + owner + "/" + repo + "/contents" + encodedPath + "?ref=" + branch;
        String json = get(url, token);

        JsonNode node = MAPPER.readTree(json);
        if (node.has("content")) {
            String base64Content = node.get("content").asText().replace("\n", "").replace("\r", "");
            return new String(Base64.getDecoder().decode(base64Content));
        }
        return "";
    }

    /**
     * Fallback when circuit breaker is OPEN for getFileContent.
     */
    public String getFileContentFallback(String token, String owner, String repo, String path, String branch, Exception ex) {
        log.warn("Circuit breaker OPEN for GitHub getFileContent: {}", ex.getMessage());
        return "";
    }

    /**
     * Verify if a token has access to a repository.
     */
    @CircuitBreaker(name = "gitHubClient", fallbackMethod = "verifyAccessFallback")
    public boolean verifyAccess(String token, String owner, String repo) {
        try {
            get("/repos/" + owner + "/" + repo, token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Fallback when circuit breaker is OPEN for verifyAccess.
     */
    public boolean verifyAccessFallback(String token, String owner, String repo, Exception ex) {
        log.warn("Circuit breaker OPEN for GitHub verifyAccess: {}", ex.getMessage());
        return false;
    }

    // ── Git Write Operations (used by GitWriterService) ──

    /**
     * Get the SHA of the default branch's HEAD commit.
     */
    @CircuitBreaker(name = "gitHubClient", fallbackMethod = "getDefaultBranchShaFallback")
    public String getDefaultBranchSha(String token, String owner, String repo) throws Exception {
        String json = get("/repos/" + owner + "/" + repo + "/branches/" + getDefaultBranchName(token, owner, repo), token);
        JsonNode node = MAPPER.readTree(json);
        return node.get("commit").get("sha").asText();
    }

    public String getDefaultBranchShaFallback(String token, String owner, String repo, Exception ex) {
        log.warn("Circuit breaker OPEN for GitHub getDefaultBranchSha: {}", ex.getMessage());
        throw new RuntimeException("Cannot get default branch SHA: " + ex.getMessage());
    }

    private String getDefaultBranchName(String token, String owner, String repo) throws Exception {
        String json = get("/repos/" + owner + "/" + repo, token);
        JsonNode node = MAPPER.readTree(json);
        return node.get("default_branch").asText("main");
    }

    /**
     * Create a new branch from a given SHA.
     */
    @CircuitBreaker(name = "gitHubClient", fallbackMethod = "createBranchFallback")
    public void createBranch(String token, String owner, String repo, String branchName, String sha) throws Exception {
        String body = MAPPER.writeValueAsString(Map.of("ref", "refs/heads/" + branchName, "sha", sha));
        post("/repos/" + owner + "/" + repo + "/git/refs", token, body);
    }

    public void createBranchFallback(String token, String owner, String repo, String branchName, String sha, Exception ex) {
        log.warn("Circuit breaker OPEN for GitHub createBranch: {}", ex.getMessage());
        throw new RuntimeException("Cannot create branch: " + ex.getMessage());
    }

    /**
     * Get the SHA of a file at a given path and branch. Returns null if file doesn't exist.
     */
    @CircuitBreaker(name = "gitHubClient", fallbackMethod = "getFileShaFallback")
    public String getFileSha(String token, String owner, String repo, String path, String branch) throws Exception {
        String encodedPath = "/" + path;
        String url = "/repos/" + owner + "/" + repo + "/contents" + encodedPath + "?ref=" + branch;
        try {
            String json = get(url, token);
            JsonNode node = MAPPER.readTree(json);
            return node.has("sha") ? node.get("sha").asText() : null;
        } catch (Exception e) {
            return null; // File doesn't exist yet
        }
    }

    public String getFileShaFallback(String token, String owner, String repo, String path, String branch, Exception ex) {
        log.warn("Circuit breaker OPEN for GitHub getFileSha: {}", ex.getMessage());
        return null;
    }

    /**
     * Create or update a file in a repository.
     */
    @CircuitBreaker(name = "gitHubClient", fallbackMethod = "createOrUpdateFileFallback")
    public JsonNode createOrUpdateFile(String token, String owner, String repo, String path,
                                       String content, String message, String branch, String sha) throws Exception {
        String encodedContent = Base64.getEncoder().encodeToString(content.getBytes());
        Map<String, Object> bodyMap = new LinkedHashMap<>();
        bodyMap.put("message", message);
        bodyMap.put("content", encodedContent);
        bodyMap.put("branch", branch);
        if (sha != null) {
            bodyMap.put("sha", sha);
        }
        String body = MAPPER.writeValueAsString(bodyMap);
        String json;
        if (sha != null) {
            json = put("/repos/" + owner + "/" + repo + "/contents/" + path, token, body);
        } else {
            json = put("/repos/" + owner + "/" + repo + "/contents/" + path, token, body);
        }
        return MAPPER.readTree(json);
    }

    public JsonNode createOrUpdateFileFallback(String token, String owner, String repo, String path,
                                               String content, String message, String branch, String sha, Exception ex) {
        log.warn("Circuit breaker OPEN for GitHub createOrUpdateFile: {}", ex.getMessage());
        throw new RuntimeException("Cannot create/update file: " + ex.getMessage());
    }

    /**
     * Create a pull request.
     */
    @CircuitBreaker(name = "gitHubClient", fallbackMethod = "createPullRequestFallback")
    public JsonNode createPullRequest(String token, String owner, String repo,
                                      String title, String body, String head, String base) throws Exception {
        Map<String, String> bodyMap = new LinkedHashMap<>();
        bodyMap.put("title", title);
        bodyMap.put("body", body);
        bodyMap.put("head", head);
        bodyMap.put("base", base);
        String requestBody = MAPPER.writeValueAsString(bodyMap);
        String json = post("/repos/" + owner + "/" + repo + "/pulls", token, requestBody);
        return MAPPER.readTree(json);
    }

    public JsonNode createPullRequestFallback(String token, String owner, String repo,
                                              String title, String body, String head, String base, Exception ex) {
        log.warn("Circuit breaker OPEN for GitHub createPullRequest: {}", ex.getMessage());
        throw new RuntimeException("Cannot create PR: " + ex.getMessage());
    }

    private GitHubFile parseFileNode(JsonNode node) {
        return new GitHubFile(
            node.get("name").asText(),
            node.get("path").asText(),
            node.get("type").asText(),
            node.get("sha").asText(),
            node.get("size").asLong()
        );
    }

    private String get(String path, String token) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(API_BASE + path))
            .header("Accept", "application/vnd.github.v3+json")
            .header("Authorization", "Bearer " + token)
            .header("User-Agent", "CloudBuilder")
            .GET()
            .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new RuntimeException("GitHub API error " + response.statusCode() + ": " + response.body());
        }

        return response.body();
    }

    private String post(String path, String token, String body) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(API_BASE + path))
            .header("Accept", "application/vnd.github.v3+json")
            .header("Authorization", "Bearer " + token)
            .header("User-Agent", "CloudBuilder")
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(body))
            .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() < 200 || response.statusCode() > 299) {
            throw new RuntimeException("GitHub API error " + response.statusCode() + ": " + response.body());
        }

        return response.body();
    }

    private String put(String path, String token, String body) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(API_BASE + path))
            .header("Accept", "application/vnd.github.v3+json")
            .header("Authorization", "Bearer " + token)
            .header("User-Agent", "CloudBuilder")
            .header("Content-Type", "application/json")
            .PUT(HttpRequest.BodyPublishers.ofString(body))
            .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() < 200 || response.statusCode() > 299) {
            throw new RuntimeException("GitHub API error " + response.statusCode() + ": " + response.body());
        }

        return response.body();
    }

    // ── DTOs ──

    public record GitHubRepo(
        long id,
        String fullName,
        String name,
        String owner,
        String description,
        String defaultBranch,
        String language,
        boolean isPrivate,
        String updatedAt,
        String htmlUrl
    ) {}

    public record GitHubFile(
        String name,
        String path,
        String type,    // "file" or "dir"
        String sha,
        long size
    ) {}
}
