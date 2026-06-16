package com.cloudbuilder.github.infrastructure.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.*;

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
     * List files and directories in a repository path.
     */
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
     * Get the content of a single file (decoded from base64).
     */
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
     * Verify if a token has access to a repository.
     */
    public boolean verifyAccess(String token, String owner, String repo) {
        try {
            get("/repos/" + owner + "/" + repo, token);
            return true;
        } catch (Exception e) {
            return false;
        }
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
