package com.cloudbuilder.shared.event.web;

import com.cloudbuilder.shared.event.PlatformEvent;
import com.cloudbuilder.shared.security.JwtTokenProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

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
    private final Map<String, SseEmitter> emitters = new ConcurrentHashMap<>();
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

        // Configura o contexto de segurança para o restante do pipeline
        var userId = jwtTokenProvider.getUserId(token);
        var roles = jwtTokenProvider.getRoles(token);
        var tenantId = jwtTokenProvider.getTenantId(token);
        if (tenantId != null) {
            com.cloudbuilder.shared.security.TenantContext.setTenantId(tenantId);
        }
        var authorities = roles.stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()))
                .collect(Collectors.toList());
        var authentication = new UsernamePasswordAuthenticationToken(userId, null, authorities);
        SecurityContextHolder.getContext().setAuthentication(authentication);

        var emitter = new SseEmitter(Long.MAX_VALUE);
        String id = java.util.UUID.randomUUID().toString();
        emitters.put(id, emitter);

        emitter.onCompletion(() -> {
            emitters.remove(id);
            SecurityContextHolder.clearContext();
        });
        emitter.onTimeout(() -> {
            emitters.remove(id);
            SecurityContextHolder.clearContext();
        });
        emitter.onError(e -> {
            emitters.remove(id);
            SecurityContextHolder.clearContext();
        });

        log.info("SSE client connected: {} (user: {})", id, userId);
        return emitter;
    }

    @EventListener
    public void onPlatformEvent(PlatformEvent event) {
        if (emitters.isEmpty()) return;

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
        emitters.forEach((id, emitter) -> {
            try {
                emitter.send(sseEvent);
            } catch (IOException e) {
                dead.add(id);
                emitter.completeWithError(e);
            }
        });
        dead.forEach(emitters::remove);
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of(
            "connections", emitters.size(),
            "status", "active"
        );
    }
}
