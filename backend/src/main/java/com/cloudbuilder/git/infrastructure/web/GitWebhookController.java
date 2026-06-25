package com.cloudbuilder.git.infrastructure.web;

import com.cloudbuilder.git.domain.model.Commit;
import com.cloudbuilder.git.domain.model.GitPushEvent;
import com.cloudbuilder.git.domain.model.WebhookEvent;
import com.cloudbuilder.git.domain.port.CommitRepository;
import com.cloudbuilder.git.domain.service.WebhookService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

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
    private final ApplicationEventPublisher eventPublisher;

    @Value("${cloudbuilder.git.webhook-secret:}")
    private String webhookSecret;

    public GitWebhookController(WebhookService webhookService,
                                 CommitRepository commitRepository,
                                 ApplicationEventPublisher eventPublisher) {
        this.webhookService = webhookService;
        this.commitRepository = commitRepository;
        this.eventPublisher = eventPublisher;
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

        // Verify HMAC-SHA256 signature
        if (webhookSecret != null && !webhookSecret.isBlank()) {
            boolean verified = webhookService.verifySignature(body, signature, webhookSecret);
            if (!verified) {
                log.warn("Webhook signature verification FAILED for deliveryId={}", deliveryId);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Invalid signature"));
            }
            log.debug("Webhook signature verified for deliveryId={}", deliveryId);
        } else {
            log.warn("No webhook secret configured — skipping signature verification for deliveryId={}", deliveryId);
        }

        // Only process push events for commit extraction
        if (!"push".equalsIgnoreCase(eventType)) {
            log.debug("Ignoring non-push event type={}", eventType);
            return ResponseEntity.accepted()
                    .body(Map.of("status", "accepted", "event", eventType, "processed", false));
        }

        try {
            // Parse the push payload manually to extract commits and branch info
            // We parse from the raw JSON body without Jackson dependency
            PushPayload payload = parsePushPayload(body);

            if (payload == null) {
                log.warn("Failed to parse push payload for deliveryId={}", deliveryId);
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Failed to parse push payload"));
            }

            // Extract repository ID from the payload
            String repoId = payload.repoId;
            if (repoId == null || repoId.isBlank()) {
                log.warn("No repository ID found in payload for deliveryId={}", deliveryId);
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "No repository identifier in payload"));
            }

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

    /**
     * Simple push payload parser that extracts key fields from the GitHub
     * webhook JSON push event payload using string operations.
     * <p>
     * This avoids adding a JSON parsing dependency for a single endpoint.
     */
    private PushPayload parsePushPayload(String body) {
        if (body == null || body.isBlank()) {
            return null;
        }

        PushPayload result = new PushPayload();

        // Extract repository full_name (used as repoId)
        result.repoId = extractJsonString(body, "full_name");
        if (result.repoId != null) {
            // GitHub sends "owner/repo" as full_name — normalize to just the repo ID
            result.repoId = result.repoId.replace("/", "-");
        }

        // Extract branch name from ref: "refs/heads/main" → "main"
        String ref = extractJsonString(body, "ref");
        if (ref != null && ref.startsWith("refs/heads/")) {
            result.branch = ref.substring("refs/heads/".length());
        }

        // Parse commits array
        result.commits = new ArrayList<>();
        int commitsStart = body.indexOf("\"commits\"");
        if (commitsStart >= 0) {
            int arrayStart = body.indexOf('[', commitsStart);
            if (arrayStart >= 0) {
                int depth = 1;
                int pos = arrayStart + 1;
                int objectStart = -1;
                while (pos < body.length() && depth > 0) {
                    char c = body.charAt(pos);
                    if (c == '{' && depth == 1) {
                        objectStart = pos;
                    }
                    if (c == '{') {
                        // Guard for nested objects within commits
                    }
                    if (c == '}') {
                        if (depth == 1 && objectStart >= 0) {
                            // Extract single commit object
                            String commitJson = body.substring(objectStart, pos + 1);
                            ParsedCommit parsed = parseSingleCommit(commitJson);
                            if (parsed != null) {
                                result.commits.add(parsed);
                            }
                            objectStart = -1;
                        }
                    }
                    if (c == '[') depth++;
                    if (c == ']') depth--;
                    pos++;
                }
            }
        }

        return result;
    }

    /**
     * Parse a single commit JSON object from the push payload.
     */
    private ParsedCommit parseSingleCommit(String json) {
        if (json == null || json.length() < 2) {
            return null;
        }

        String sha = extractJsonString(json, "id");
        String message = extractJsonString(json, "message");
        String author = null;
        String authorEmail = null;
        String timestampStr = null;

        // Extract author info from nested "author" object
        int authorIdx = json.indexOf("\"author\"");
        if (authorIdx >= 0) {
            int authorObjStart = json.indexOf('{', authorIdx);
            if (authorObjStart >= 0) {
                int braceDepth = 1;
                int pos = authorObjStart + 1;
                while (pos < json.length() && braceDepth > 0) {
                    if (json.charAt(pos) == '{') braceDepth++;
                    if (json.charAt(pos) == '}') braceDepth--;
                    pos++;
                }
                String authorJson = json.substring(authorObjStart, pos);
                author = extractJsonString(authorJson, "name");
                authorEmail = extractJsonString(authorJson, "email");
            }
        }

        // Extract timestamp
        timestampStr = extractJsonString(json, "timestamp");
        Instant timestamp;
        if (timestampStr != null) {
            try {
                timestamp = Instant.parse(timestampStr);
            } catch (Exception e) {
                timestamp = Instant.now();
            }
        } else {
            timestamp = Instant.now();
        }

        if (sha == null || sha.isBlank()) {
            return null;
        }

        return new ParsedCommit(sha, message, author, authorEmail, timestamp);
    }

    /**
     * Extract a string value from a JSON key-value pair using simple parsing.
     * Finds {@code "key":"value"} or {@code "key": "value"} patterns.
     */
    private String extractJsonString(String json, String key) {
        if (json == null || key == null) {
            return null;
        }

        String searchKey = "\"" + key + "\"";
        int keyIdx = json.indexOf(searchKey);
        if (keyIdx < 0) {
            return null;
        }

        int colonIdx = json.indexOf(':', keyIdx + searchKey.length());
        if (colonIdx < 0) {
            return null;
        }

        int valueStart = colonIdx + 1;
        // Skip whitespace
        while (valueStart < json.length() && json.charAt(valueStart) == ' ') {
            valueStart++;
        }

        if (valueStart >= json.length()) {
            return null;
        }

        // Check if the value is a string (starts with quote)
        if (json.charAt(valueStart) == '"') {
            int quoteEnd = valueStart + 1;
            while (quoteEnd < json.length()) {
                char c = json.charAt(quoteEnd);
                if (c == '\\') {
                    quoteEnd += 2; // skip escaped character
                    continue;
                }
                if (c == '"') {
                    return json.substring(valueStart + 1, quoteEnd);
                }
                quoteEnd++;
            }
        }

        // Check if the value is null
        if (json.startsWith("null", valueStart)) {
            return null;
        }

        return null;
    }

    /**
     * Internal DTO for parsed GitHub push payload fields.
     */
    private static class PushPayload {
        String repoId;
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
