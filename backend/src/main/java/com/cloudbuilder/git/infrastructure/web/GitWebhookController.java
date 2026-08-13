package com.cloudbuilder.git.infrastructure.web;

import com.cloudbuilder.git.domain.model.Commit;
import com.cloudbuilder.git.domain.model.ConnectedRepository;
import com.cloudbuilder.git.domain.model.GitPushEvent;
import com.cloudbuilder.git.domain.port.CommitRepository;
import com.cloudbuilder.git.domain.port.ConnectedRepositoryPort;
import com.cloudbuilder.git.domain.service.WebhookService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * GitHub-specific webhook receiver endpoint.
 * <p>
 * Per ADR-016: {@code POST /api/v1/git/webhooks/github} with HMAC-SHA256
 * signature verification. Integrates with WebhookService for verification
 * and publishes GitPushEvent for downstream processing.
 * <p>
 * This controller is separate from the generic {@link GitController#receiveWebhook}
 * endpoint because GitHub webhooks require specific header parsing and
 * commit extraction from the push payload.
 */
@RestController
@RequestMapping("/api/v1/git/webhooks/github")
public class GitWebhookController {

    private static final Logger log = LoggerFactory.getLogger(GitWebhookController.class);

    private final WebhookService webhookService;
    private final CommitRepository commitRepository;
    private final ConnectedRepositoryPort connectedRepositoryPort;
    private final ApplicationEventPublisher eventPublisher;
    private final ObjectMapper objectMapper;

    @Value("${cloudbuilder.git.webhook-secret:}")
    private String webhookSecret;

    public GitWebhookController(WebhookService webhookService,
                                 CommitRepository commitRepository,
                                 ConnectedRepositoryPort connectedRepositoryPort,
                                 ApplicationEventPublisher eventPublisher,
                                 ObjectMapper objectMapper) {
        this.webhookService = webhookService;
        this.commitRepository = commitRepository;
        this.connectedRepositoryPort = connectedRepositoryPort;
        this.eventPublisher = eventPublisher;
        this.objectMapper = objectMapper;
    }

    /**
     * Receive a GitHub webhook push event, verify HMAC-SHA256 signature,
     * persist commits, and publish a GitPushEvent for downstream processing.
     *
     * @param eventType     X-GitHub-Event header (e.g., "push")
     * @param signature     X-Hub-Signature-256 header (format: "sha256=...")
     * @param deliveryId    X-GitHub-Delivery header (unique delivery identifier)
     * @param body          Raw JSON request body
     * @return 202 if accepted, 401 if signature verification fails
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> receiveGitHubWebhook(
            @RequestHeader("X-GitHub-Event") String eventType,
            @RequestHeader("X-Hub-Signature-256") String signature,
            @RequestHeader("X-GitHub-Delivery") String deliveryId,
            @RequestBody String body) {

        log.info("Received GitHub webhook: event={}, deliveryId={}", eventType, deliveryId);

        if (webhookSecret == null || webhookSecret.isBlank()) {
            log.error("GitHub webhook rejected because cloudbuilder.git.webhook-secret is not configured");
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of("error", "Webhook receiver is not configured"));
        }
        if (!webhookService.verifySignature(body, signature, webhookSecret)) {
            log.warn("Webhook signature verification FAILED for deliveryId={}", deliveryId);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid signature"));
        }
        log.debug("Webhook signature verified for deliveryId={}", deliveryId);

        // Only process push events for commit extraction
        if (!"push".equalsIgnoreCase(eventType)) {
            log.debug("Ignoring non-push event type={}", eventType);
            return ResponseEntity.accepted()
                    .body(Map.of("status", "accepted", "event", eventType, "processed", false));
        }

        try {
            PushPayload payload = parsePushPayload(body);

            if (payload == null) {
                log.warn("Failed to parse push payload for deliveryId={}", deliveryId);
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Failed to parse push payload"));
            }

            if (payload.repositoryFullName == null || payload.repositoryFullName.isBlank()) {
                log.warn("No repository full_name found in payload for deliveryId={}", deliveryId);
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "No repository identifier in payload"));
            }
            ConnectedRepository repository = connectedRepositoryPort
                .findByFullName(payload.repositoryFullName)
                .orElse(null);
            if (repository == null) {
                log.warn("Webhook received for an unconnected repository: {}",
                    payload.repositoryFullName);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Repository is not connected"));
            }
            String repoId = repository.getId();

            // Persist commits
            List<Commit> savedCommits = new ArrayList<>();
            if (payload.commits != null) {
                for (ParsedCommit c : payload.commits) {
                    // Avoid duplicates — skip if SHA already exists for this repo
                    boolean alreadyExists = !commitRepository
                            .findByRepoIdAndSha(repoId, c.sha)
                            .isEmpty();

                    if (!alreadyExists) {
                        Commit commit = new Commit(
                                repoId, c.sha, c.message, c.author,
                                c.authorEmail, c.timestamp
                        );
                        savedCommits.add(commitRepository.save(commit));
                    }
                }
            }

            // Publish GitPushEvent for downstream processing
            List<String> commitShas = savedCommits.stream()
                    .map(Commit::getSha)
                    .toList();

            GitPushEvent pushEvent = new GitPushEvent(repoId, commitShas, payload.branch);
            eventPublisher.publishEvent(pushEvent);

            log.info("Processed GitHub push: repoId={}, branch={}, commitsSaved={}",
                    repoId, payload.branch, savedCommits.size());

            return ResponseEntity.accepted()
                    .body(Map.of(
                            "status", "accepted",
                            "event", eventType,
                            "processed", true,
                            "repoId", repoId,
                            "branch", payload.branch != null ? payload.branch : "",
                            "commitsSaved", savedCommits.size()
                    ));

        } catch (Exception e) {
            log.error("Error processing GitHub webhook deliveryId={}: {}", deliveryId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Internal processing error"));
        }
    }

    private PushPayload parsePushPayload(String body) {
        if (body == null || body.isBlank()) {
            return null;
        }
        try {
            JsonNode root = objectMapper.readTree(body);
            PushPayload result = new PushPayload();
            result.repositoryFullName = textOrNull(root.path("repository").path("full_name"));
            String ref = textOrNull(root.path("ref"));
            if (ref != null && ref.startsWith("refs/heads/")) {
                result.branch = ref.substring("refs/heads/".length());
            }
            result.commits = new ArrayList<>();
            for (JsonNode commit : root.path("commits")) {
                String sha = textOrNull(commit.path("id"));
                if (sha == null || sha.isBlank()) {
                    continue;
                }
                Instant timestamp = parseTimestamp(textOrNull(commit.path("timestamp")));
                JsonNode author = commit.path("author");
                result.commits.add(new ParsedCommit(
                    sha,
                    textOrNull(commit.path("message")),
                    textOrNull(author.path("name")),
                    textOrNull(author.path("email")),
                    timestamp));
            }
            return result;
        } catch (Exception malformedPayload) {
            log.warn("Malformed GitHub push payload", malformedPayload);
            return null;
        }
    }

    private static String textOrNull(JsonNode node) {
        return node.isTextual() ? node.textValue() : null;
    }

    private static Instant parseTimestamp(String value) {
        if (value != null) {
            try {
                return Instant.parse(value);
            } catch (RuntimeException ignored) {
                // GitHub timestamps should be ISO-8601; use receipt time if malformed.
            }
        }
        return Instant.now();
    }

    /**
     * Internal DTO for parsed GitHub push payload fields.
     */
    private static class PushPayload {
        String repositoryFullName;
        String branch;
        List<ParsedCommit> commits;
    }

    /**
     * Internal DTO for a single parsed commit from the push payload.
     */
    private static class ParsedCommit {
        final String sha;
        final String message;
        final String author;
        final String authorEmail;
        final Instant timestamp;

        ParsedCommit(String sha, String message, String author,
                     String authorEmail, Instant timestamp) {
            this.sha = sha;
            this.message = message;
            this.author = author;
            this.authorEmail = authorEmail;
            this.timestamp = timestamp;
        }
    }
}
