package com.cloudbuilder.featureflags.infrastructure.web;

import com.cloudbuilder.featureflags.domain.service.FeatureFlagService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("FeatureFlagController Tests")
class FeatureFlagControllerTest {

    @Mock
    private FeatureFlagService flagService;
    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private FeatureFlagController featureFlagController;

    private Authentication mockAuth() {
        var auth = mock(Authentication.class);
        when(auth.getName()).thenReturn("user-1");
        return auth;
    }

    @Test
    @DisplayName("GET /feature-flags - returns flags")
    void getFlags() {
        when(flagService.getFlags(any())).thenReturn(List.of());

        var response = featureFlagController.getFlags(mockAuth());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isEmpty();
    }

    @Test
    @DisplayName("GET /feature-flags/{key} - checks flag enabled")
    void checkFlag() {
        when(flagService.isEnabled(eq("dark-mode"), any())).thenReturn(true);

        var response = featureFlagController.checkFlag("dark-mode", mockAuth());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsEntry("enabled", true);
    }

    @Test
    @DisplayName("GET /feature-flags/{key}/check - checks flag (alt path)")
    void checkFlagAlt() {
        when(flagService.isEnabled(eq("dark-mode"), any())).thenReturn(false);

        var response = featureFlagController.checkFlagAlt("dark-mode", mockAuth());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsEntry("enabled", false);
    }

    @Test
    @DisplayName("DELETE /feature-flags/{id} - deletes flag")
    void deleteFlag() {
        when(flagService.deleteFlag("flag-1")).thenReturn(true);

        var response = featureFlagController.deleteFlag("flag-1");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
    }

    @Test
    @DisplayName("DELETE /feature-flags/{id} - returns 404 when not found")
    void deleteFlagNotFound() {
        when(flagService.deleteFlag("nonexistent")).thenReturn(false);

        var response = featureFlagController.deleteFlag("nonexistent");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    @DisplayName("POST /feature-flags/refresh - refreshes cache")
    void refreshCache() {
        var response = featureFlagController.refreshCache();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsEntry("status", "cache_evicted");
    }
}
