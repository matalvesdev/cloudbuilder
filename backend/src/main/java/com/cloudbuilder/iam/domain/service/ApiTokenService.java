package com.cloudbuilder.iam.domain.service;

import com.cloudbuilder.iam.domain.model.ApiToken;
import com.cloudbuilder.iam.domain.port.ApiTokenRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class ApiTokenService {

    private final ApiTokenRepository apiTokenRepository;
    private static final String HMAC_ALGO = "HmacSHA256";

    public ApiTokenService(ApiTokenRepository apiTokenRepository) {
        this.apiTokenRepository = apiTokenRepository;
    }

    public record TokenResult(String id, String name, String token, String prefix, String scopes, Instant createdAt) {}

    public TokenResult createToken(String userId, String tenantId, String name, String scopes) {
        // Generate raw token
        byte[] tokenBytes = new byte[32];
        new SecureRandom().nextBytes(tokenBytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
        String prefix = rawToken.substring(0, Math.min(8, rawToken.length()));

        // Hash token for storage
        String tokenHash = hashToken(rawToken);

        ApiToken token = new ApiToken(userId, tenantId, name, tokenHash, prefix, scopes);
        apiTokenRepository.save(token);

        return new TokenResult(token.getId(), name, rawToken, prefix, scopes, token.getCreatedAt());
    }

    public List<ApiToken> listTokens(String userId) {
        return apiTokenRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public void revokeToken(String tokenId, String userId) {
        Optional<ApiToken> token = apiTokenRepository.findById(tokenId);
        if (token.isPresent() && token.get().getUserId().equals(userId)) {
            token.get().revoke();
            apiTokenRepository.save(token.get());
        }
    }

    public void deleteToken(String tokenId, String userId) {
        Optional<ApiToken> token = apiTokenRepository.findById(tokenId);
        if (token.isPresent() && token.get().getUserId().equals(userId)) {
            apiTokenRepository.deleteById(tokenId);
        }
    }

    public boolean validateToken(String rawToken) {
        String hash = hashToken(rawToken);
        Optional<ApiToken> token = apiTokenRepository.findByTokenHash(hash);
        if (token.isEmpty() || !token.get().isActive()) return false;
        token.get().recordUsage();
        apiTokenRepository.save(token.get());
        return true;
    }

    private String hashToken(String token) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGO);
            mac.init(new SecretKeySpec("cloudbuilder-api-token-key".getBytes(StandardCharsets.UTF_8), HMAC_ALGO));
            byte[] hash = mac.doFinal(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            throw new RuntimeException("Failed to hash token", e);
        }
    }
}
