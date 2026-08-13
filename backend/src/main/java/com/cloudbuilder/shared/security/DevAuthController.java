package com.cloudbuilder.shared.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Set;
import java.util.UUID;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/v1/auth")
@Profile("dev")
public class DevAuthController {

    private static final String DEV_TENANT_ID = "dev-tenant";
    private static final Set<String> DEV_ROLES = Set.of("admin", "editor");

    private final JwtTokenProvider jwtTokenProvider;

    public DevAuthController(JwtTokenProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @PostMapping("/register")
    public ResponseEntity<LoginResponse> register(@RequestBody RegisterRequest request) {
        var userId = devUserId(request.email());
        var email = request.email();
        var name = request.name() != null ? request.name() : email.split("@")[0];
        var roles = DEV_ROLES;
        var tenantId = DEV_TENANT_ID;

        var token = jwtTokenProvider.generateAccessToken(userId, email, roles, tenantId);
        var refreshToken = jwtTokenProvider.generateRefreshToken(userId);

        return ResponseEntity.status(HttpStatus.CREATED).body(new LoginResponse(
            token, refreshToken, 900000,
            userId, name, email, roles,
            tenantId, request.tenantName() != null ? request.tenantName() : "Organização Dev",
            request.tenantSlug() != null ? request.tenantSlug() : "dev-org"
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        var userId = devUserId(request.email());
        var email = request.email();
        var roles = DEV_ROLES;
        var tenantId = DEV_TENANT_ID;

        var token = jwtTokenProvider.generateAccessToken(userId, email, roles, tenantId);
        var refreshToken = jwtTokenProvider.generateRefreshToken(userId);

        return ResponseEntity.ok(new LoginResponse(token, refreshToken, 900000,
                userId.toString(), email.split("@")[0], email, roles,
                tenantId, "Organização Dev", "dev-org"));
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(@RequestBody RefreshRequest request) {
        if (!jwtTokenProvider.isRefreshToken(request.refreshToken())) {
            return ResponseEntity.status(401).build();
        }
        var userId = jwtTokenProvider.getUserId(request.refreshToken());
        var email = "dev@cloudbuilder.com";
        var roles = DEV_ROLES;
        var tenantId = DEV_TENANT_ID;

        var token = jwtTokenProvider.generateAccessToken(userId, email, roles, tenantId);
        var refreshToken = jwtTokenProvider.generateRefreshToken(userId);

        return ResponseEntity.ok(new LoginResponse(token, refreshToken, 900000,
                userId.toString(), "Dev", email, roles,
                tenantId, "Organização Dev", "dev-org"));
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MeResponse> me(HttpServletRequest request) {
        // Extract real user info from the JWT instead of returning hardcoded "dev-user"
        // This ensures the IAM module receives a valid userId (the JWT sub UUID)
        // rather than a hardcoded string that doesn't exist in the database.
        var authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            var token = authHeader.substring(7);
            if (jwtTokenProvider.validateToken(token)) {
                var userId = jwtTokenProvider.getUserId(token);
                var roles = jwtTokenProvider.getRoles(token);
                // In dev mode we don't persist users, so the email/name from the JWT
                // is the best approximation available
                return ResponseEntity.ok(new MeResponse(
                    userId,
                    "Desenvolvedor",
                    "dev@cloudbuilder.com",
                    roles.isEmpty() ? DEV_ROLES : roles,
                    DEV_TENANT_ID,
                    "Organização Dev",
                    "dev-org"
                ));
            }
        }
        // Fallback — still better than hardcoded "dev-user" because it won't
        // collide with any real user ID format expectations
        var fallbackId = UUID.randomUUID().toString();
        return ResponseEntity.ok(new MeResponse(
            fallbackId,
            "Desenvolvedor",
            "dev@cloudbuilder.com",
            DEV_ROLES,
            DEV_TENANT_ID,
            "Organização Dev",
            "dev-org"
        ));
    }

    record ProfileUpdateRequest(String name) {}
    record ProfileResponse(String id, String name, String email) {}

    @PutMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ProfileResponse> updateProfile(
            HttpServletRequest request,
            @RequestBody ProfileUpdateRequest body) {
        var authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            var token = authHeader.substring(7);
            if (jwtTokenProvider.validateToken(token)) {
                var userId = jwtTokenProvider.getUserId(token);
                return ResponseEntity.ok(new ProfileResponse(userId, body.name(), "dev@cloudbuilder.com"));
            }
        }
        return ResponseEntity.status(401).build();
    }

    record LoginRequest(String email, String password) {}
    record RegisterRequest(String name, String email, String password, String tenantName, String tenantSlug, String role) {}
    record RefreshRequest(String refreshToken) {}
    record LoginResponse(String token, String refreshToken, long expiresIn,
                         String userId, String name, String email, Set<String> roles,
                         String tenantId, String tenantName, String tenantSlug) {}
    record MeResponse(String id, String name, String email, Set<String> roles,
                      String tenantId, String tenantName, String tenantSlug) {}

    private static String devUserId(String email) {
        return UUID.nameUUIDFromBytes(
            email.toLowerCase().getBytes(StandardCharsets.UTF_8)).toString();
    }
}
