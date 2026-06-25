package com.cloudbuilder.iam.domain.port;

import com.cloudbuilder.iam.domain.model.Session;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface SessionRepository extends JpaRepository<Session, String> {
    List<Session> findByUserId(String userId);
    List<Session> findByUserIdAndActiveTrue(String userId);
    Optional<Session> findByToken(String token);
    List<Session> findByActiveTrueAndExpiresAtBefore(Instant expiryTime);
    List<Session> findByActiveTrueAndLastActivityBefore(Instant lastActivity);
}
