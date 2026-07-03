package com.cloudbuilder.iam.domain.port;

import com.cloudbuilder.iam.domain.model.ApiToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApiTokenRepository extends JpaRepository<ApiToken, String> {
    List<ApiToken> findByUserIdAndActiveTrue(String userId);
    List<ApiToken> findByUserIdOrderByCreatedAtDesc(String userId);
    Optional<ApiToken> findByTokenHash(String tokenHash);
    long countByUserId(String userId);
}
