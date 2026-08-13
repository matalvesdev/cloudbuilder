package com.cloudbuilder.iam.domain.service;

import com.cloudbuilder.iam.domain.model.Session;
import com.cloudbuilder.iam.domain.port.SessionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

/**
 * Service for managing user sessions.
 * Provides CRUD operations and periodic cleanup of expired sessions.
 */
@Service
@Transactional
public class SessionService {

    private static final Logger log = LoggerFactory.getLogger(SessionService.class);

    private final SessionRepository sessionRepository;

    // Session timeout: 24 hours of inactivity
    private static final Duration INACTIVITY_TIMEOUT = Duration.ofHours(24);

    public SessionService(SessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    /**
     * Create a new session for a user after authentication.
     */
    public Session createSession(String userId, String token, String refreshToken,
                                  Instant expiresAt, String ipAddress, String userAgent,
                                  String tenantId) {
        var session = new Session(userId, token, refreshToken, expiresAt,
                ipAddress, userAgent, tenantId);
        return sessionRepository.save(session);
    }

    /**
     * Get session by token (for authentication filter).
     */
    @Transactional(readOnly = true)
    public Optional<Session> getSessionByToken(String token) {
        return sessionRepository.findByToken(token);
    }

    @Transactional(readOnly = true)
    public Session getSession(String sessionId) {
        return sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Sessão não encontrada: " + sessionId));
    }

    /**
     * Get all active sessions for a user.
     */
    @Transactional(readOnly = true)
    public List<Session> getActiveSessionsByUser(String userId) {
        return sessionRepository.findByUserIdAndActiveTrue(userId);
    }

    /**
     * Get all sessions for a user (including terminated).
     */
    @Transactional(readOnly = true)
    public List<Session> getAllSessionsByUser(String userId) {
        return sessionRepository.findByUserId(userId);
    }

    /**
     * Update last activity timestamp for a session.
     */
    public Session updateActivity(String sessionId) {
        var session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found: " + sessionId));
        session.setLastActivity(Instant.now());
        return sessionRepository.save(session);
    }

    /**
     * Terminate a specific session (logout).
     */
    public void terminateSession(String sessionId) {
        var session = getSession(sessionId);
        session.terminate();
        sessionRepository.save(session);
        log.info("Session {} terminated", sessionId);
    }

    /**
     * Terminate all active sessions for a user (force logout from all devices).
     */
    public void terminateAllUserSessions(String userId) {
        var sessions = sessionRepository.findByUserIdAndActiveTrue(userId);
        for (var session : sessions) {
            session.terminate();
        }
        sessionRepository.saveAll(sessions);
        log.info("All {} sessions terminated for user {}", sessions.size(), userId);
    }

    /**
     * Scheduled task to clean up expired sessions and inactive sessions.
     * Runs every 30 minutes.
     */
    @Scheduled(fixedRate = 1800000) // 30 minutes
    @Transactional
    public void cleanupExpiredSessions() {
        Instant now = Instant.now();

        // Terminate sessions past their expiry
        var expiredSessions = sessionRepository.findByActiveTrueAndExpiresAtBefore(now);
        for (var session : expiredSessions) {
            session.terminate();
        }
        sessionRepository.saveAll(expiredSessions);

        // Terminate sessions inactive for more than the timeout
        var inactivityThreshold = now.minus(INACTIVITY_TIMEOUT);
        var inactiveSessions = sessionRepository.findByActiveTrueAndLastActivityBefore(inactivityThreshold);
        for (var session : inactiveSessions) {
            session.terminate();
        }
        sessionRepository.saveAll(inactiveSessions);

        if (!expiredSessions.isEmpty() || !inactiveSessions.isEmpty()) {
            log.info("Session cleanup: terminated {} expired + {} inactive sessions",
                    expiredSessions.size(), inactiveSessions.size());
        }
    }
}
