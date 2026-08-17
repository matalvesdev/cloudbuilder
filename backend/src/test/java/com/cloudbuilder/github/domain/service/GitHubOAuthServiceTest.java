package com.cloudbuilder.github.domain.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class GitHubOAuthServiceTest {

    private GitHubOAuthService oauthService;

    @BeforeEach
    void setUp() {
        oauthService = new GitHubOAuthService();
    }

    @Test
    void buildAuthorizationUrl_WithoutClientId_ShouldReturnDevModeUrl() {
        String url = oauthService.buildAuthorizationUrl("state123");
        assertTrue(url.startsWith("/api/v1/github/callback?code=dev-mode-"));
        assertTrue(url.contains("&state=state123"));
    }

    @Test
    void exchangeCode_DevMode_ShouldReturnDevToken() {
        String token = oauthService.exchangeCode("dev-mode-test123");
        assertTrue(token.startsWith("gho_dev_"));
    }

    @Test
    void exchangeCode_NullCode_ShouldThrow() {
        assertThrows(IllegalStateException.class,
                () -> oauthService.exchangeCode(null));
    }

    @Test
    void exchangeCode_NonDevCode_ShouldThrow() {
        assertThrows(IllegalStateException.class,
                () -> oauthService.exchangeCode("real-code-123"));
    }

    @Test
    void isConfigured_WithoutClientId_ShouldReturnFalse() {
        assertFalse(oauthService.isConfigured());
    }

    @Test
    void getClientId_ShouldReturnEmptyByDefault() {
        assertEquals("", oauthService.getClientId());
    }
}
