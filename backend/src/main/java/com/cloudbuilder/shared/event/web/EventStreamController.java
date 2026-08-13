package com.cloudbuilder.shared.event.web;

import com.cloudbuilder.shared.event.PlatformEvent;
import com.cloudbuilder.shared.security.JwtTokenProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;

/**
 * SSE endpoint that streams all PlatformEvents to authenticated frontend clients.
 * Frontend subscribes once at /api/v1/events/stream and receives typed events.
 *
 * <p>This controller is ALWAYS active (no ConditionalOnProperty).
 * When Kafka is enabled, a separate {@code EventStreamKafkaBridge} consumes
 * from Kafka topics and re-publishes to the Spring event bus, which this
 * controller then picks up via @EventListener and broadcasts to SSE.
 *
 * <p>When Kafka is disabled, events flow directly from in-memory Spring
 * events to SSE via the same @EventListener path.
 */
@RestController
@RequestMapping("/api/v1/events")
public class EventStreamController {

    private static final Logger log = LoggerFactory.getLogger(EventStreamController.class);
    private final Map<String, Subscription> subscriptions = new ConcurrentHashMap<>();
    private final JwtTokenProvider jwtTokenProvider;

    public EventStreamController(JwtTokenProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@RequestParam("token") String token) {
        // Valida o token JWT (EventSource não envia headers customizados)
        if (token == null || token.isBlank() || !jwtTokenProvider.validateToken(token)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Token inválido ou ausente");
        }

        var userId = jwtTokenProvider.getUserId(token);
        var tenantId = jwtTokenProvider.getTenantId(token);
        if (tenantId == null || tenantId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Token sem organização ativa");
        }

        var emitter = new SseEmitter(Long.MAX_VALUE);
        String id = java.util.UUID.randomUUID().toString();
        subscriptions.put(id, new Subscription(tenantId, emitter));

        emitter.onCompletion(() -> subscriptions.remove(id));
        emitter.onTimeout(() -> subscriptions.remove(id));
        emitter.onError(e -> subscriptions.remove(id));

        log.info("SSE client connected: {} (user: {}, tenant: {})", id, userId, tenantId);
        return emitter;
    }

    @EventListener
    public void onPlatformEvent(PlatformEvent event) {
        if (subscriptions.isEmpty()) return;

        var sseEvent = SseEmitter.event()
            .name(event.getEventType())
            .data(Map.of(
                "type", event.getEventType(),
                "tenantId", event.getTenantId(),
                "timestamp", event.getTimestamp().toString(),
                "eventId", event.getEventId(),
                "payload", event
            ));

        var dead = new java.util.ArrayList<String>();
        subscriptions.forEach((id, subscription) -> {
            if (!Objects.equals(subscription.tenantId(), event.getTenantId())) {
                return;
            }
            try {
                subscription.emitter().send(sseEvent);
            } catch (IOException e) {
                dead.add(id);
                subscription.emitter().completeWithError(e);
            }
        });
        dead.forEach(subscriptions::remove);
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of(
            "connections", subscriptions.size(),
            "status", "active"
        );
    }

    private record Subscription(String tenantId, SseEmitter emitter) {}
}
