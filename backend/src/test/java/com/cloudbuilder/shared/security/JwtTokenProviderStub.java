package com.cloudbuilder.shared.security;

import java.util.*;

/**
 * Stub for JwtTokenProvider used in tests.
 * Avoids Mockito's inline mock maker which is incompatible with JDK 25.
 */
public class JwtTokenProviderStub extends JwtTokenProvider {

    private boolean validateTokenResult = true;
    private String userId = UUID.randomUUID().toString();
    private final Set<String> roles = new HashSet<>(Set.of("admin"));
    private String tenantId;
    private String accessToken = "access-token";
    private String refreshToken = "refresh-token";

    public void setValidateTokenResult(boolean result) {
        this.validateTokenResult = result;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }

    @Override
    public String generateAccessToken(String userId, String email, Set<String> roles) {
        return accessToken;
    }

    @Override
    public String generateAccessToken(String userId, String email, Set<String> roles, String tenantId) {
        return accessToken;
    }

    @Override
    public String generateRefreshToken(String userId) {
        return refreshToken;
    }

    @Override
    public boolean validateToken(String token) {
        return validateTokenResult;
    }

    @Override
    public String getUserId(String token) {
        return userId;
    }

    @Override
    public Set<String> getRoles(String token) {
        return roles;
    }

    @Override
    public String getTenantId(String token) {
        return tenantId;
    }
}
