package com.cloudbuilder.git.domain.service;

import com.cloudbuilder.git.domain.model.WebhookEvent;
import com.cloudbuilder.git.domain.port.WebhookEventPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Service for handling webhook events from Git providers (GitHub, GitLab, Bitbucket).
 * Performs HMAC-SHA256 signature verification before processing.
 *
 * TIER 0 reference: GitHub Webhooks docs — https://docs.github.com/en/webhooks
 */
@Service
public class WebhookService {

    private static final Logger log = LoggerFactory.getLogger(WebhookService.class);
    private static final String HMAC_ALGORITHM = "HmacSHA256";

    private final WebhookEventPort webhookEventPort;

    public WebhookService(WebhookEventPort webhookEventPort) {
        this.webhookEventPort = webhookEventPort;
    }

    /**
     * Receive and verify a webhook event.
     * HMAC signature is verified against the shared secret before processing.
     *
     * @param eventType   The type of webhook event (push, pull_request, etc.)
     * @param repositoryId The repository this event belongs to
     * @param payload     Raw JSON payload of the webhook
     * @param signature   HMAC-SHA256 signature from the provider (format: "sha256=...")
     * @param secret     Shared secret for HMAC verification
     * @param deliveryId Unique delivery ID from the provider
     * @param branch     Branch name (if applicable)
     * @param commitSha  Commit SHA (if applicable)
     * @param actor      User who triggered the event
     * @return The processed WebhookEvent
     */
    @Transactional
    public WebhookEvent receiveEvent(String eventType, String repositoryId, String payload,
                                      String signature, String secret, String deliveryId,
                                      String branch, String commitSha, String actor) {
        WebhookEvent.EventType type = parseEventType(eventType);

        WebhookEvent event = new WebhookEvent(
                type, repositoryId, payload, signature, deliveryId,
                branch, commitSha, actor
        );

        if (secret != null && !secret.isBlank()) {
            boolean verified = verifySignature(payload, signature, secret);
            if (verified) {
                event.setStatus(WebhookEvent.Status.VERIFIED);
                log.info("Webhook {} verified for repository {}", deliveryId, repositoryId);
            } else {
                event.setStatus(WebhookEvent.Status.VERIFICATION_FAILED);
                event.setFailureReason("HMAC signature mismatch");
                log.warn("Webhook {} verification FAILED for repository {}", deliveryId, repositoryId);
            }
        } else {
            // No secret configured — skip verification (dev mode)
            event.setStatus(WebhookEvent.Status.VERIFIED);
            log.info("Webhook {} received (no secret — dev mode)", deliveryId);
        }

        WebhookEvent saved = webhookEventPort.save(event);

        // Attempt to process if verified
        if (saved.getStatus() == WebhookEvent.Status.VERIFIED) {
            try {
                processEvent(saved);
            } catch (Exception e) {
                log.error("Failed to process webhook {}: {}", deliveryId, e.getMessage());
                saved.setStatus(WebhookEvent.Status.FAILED);
                saved.setFailureReason(e.getMessage());
                webhookEventPort.save(saved);
            }
        }

        return saved;
    }

    /**
     * Verify HMAC-SHA256 signature of a webhook payload.
     *
     * @param payload   Raw request body
     * @param signature Signature header value (format: "sha256=hexdigest" or "sha1=hexdigest")
     * @param secret    Shared secret
     * @return true if signature matches
     */
    public boolean verifySignature(String payload, String signature, String secret) {
        if (signature == null || secret == null) {
            return false;
        }

        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            SecretKeySpec keySpec = new SecretKeySpec(secret.getBytes(), HMAC_ALGORITHM);
            mac.init(keySpec);
            byte[] computedHash = mac.doFinal(payload.getBytes());
            String computedHex = HexFormat.of().formatHex(computedHash);

            // Support both "sha256=..." and raw hex formats
            String expectedHash = signature;
            if (signature.startsWith("sha256=")) {
                expectedHash = signature.substring(7);
            } else if (signature.startsWith("sha1=")) {
                // SHA1 is weaker but some providers still use it
                Mac sha1Mac = Mac.getInstance("HmacSHA1");
                sha1Mac.init(keySpec);
                byte[] sha1Hash = sha1Mac.doFinal(payload.getBytes());
                return HexFormat.of().formatHex(sha1Hash).equals(signature.substring(5));
            }

            return computedHex.equals(expectedHash);
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            log.error("HMAC verification error: {}", e.getMessage());
            return false;
        }
    }

    @Transactional(readOnly = true)
    public Optional<WebhookEvent> getEvent(String id) {
        return webhookEventPort.findById(id);
    }

    @Transactional(readOnly = true)
    public List<WebhookEvent> getEventsByRepository(String repositoryId) {
        return webhookEventPort.findByRepositoryIdOrderByReceivedAtDesc(repositoryId);
    }

    @Transactional(readOnly = true)
    public List<WebhookEvent> getEventsByStatus(WebhookEvent.Status status) {
        return webhookEventPort.findByStatus(status);
    }

    /**
     * Retry processing a failed webhook event.
     * Resets the event status to VERIFIED and re-processes it.
     *
     * @param id the webhook event ID
     * @return map with status and message
     */
    @Transactional
    public Map<String, Object> retryEvent(String id) {
        WebhookEvent event = webhookEventPort.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Webhook event not found: " + id));

        if (event.getStatus() != WebhookEvent.Status.FAILED
                && event.getStatus() != WebhookEvent.Status.VERIFICATION_FAILED) {
            return Map.of(
                    "status", "skipped",
                    "message", "Event must be in FAILED or VERIFICATION_FAILED status to retry"
            );
        }

        // Reset and re-process
        event.setStatus(WebhookEvent.Status.VERIFIED);
        event.setFailureReason(null);
        webhookEventPort.save(event);

        try {
            processEvent(event);
            log.info("Webhook {} retry successful", id);
            return Map.of(
                    "status", "success",
                    "message", "Webhook reprocessado com sucesso",
                    "eventId", id
            );
        } catch (Exception e) {
            log.error("Webhook {} retry failed: {}", id, e.getMessage());
            event.setStatus(WebhookEvent.Status.FAILED);
            event.setFailureReason(e.getMessage());
            webhookEventPort.save(event);
            return Map.of(
                    "status", "failed",
                    "message", "Falha ao reprocessar webhook: " + e.getMessage(),
                    "eventId", id
            );
        }
    }

    /**
     * Process a verified webhook event.
     * In a real implementation this would trigger CI/CD pipelines,
     * update deployment status, etc.
     */
    private void processEvent(WebhookEvent event) {
        log.info("Processing webhook {} type={} repo={} branch={}",
                event.getDeliveryId(), event.getEventType(),
                event.getRepositoryId(), event.getBranch());

        event.setProcessedAt(Instant.now());
        event.setStatus(WebhookEvent.Status.PROCESSED);
        webhookEventPort.save(event);
    }

    private WebhookEvent.EventType parseEventType(String type) {
        if (type == null) return WebhookEvent.EventType.UNKNOWN;
        return switch (type.toLowerCase()) {
            case "push" -> WebhookEvent.EventType.PUSH;
            case "pull_request" -> WebhookEvent.EventType.PULL_REQUEST;
            case "merge" -> WebhookEvent.EventType.MERGE;
            case "tag" -> WebhookEvent.EventType.TAG;
            case "release" -> WebhookEvent.EventType.RELEASE;
            default -> WebhookEvent.EventType.UNKNOWN;
        };
    }
}
