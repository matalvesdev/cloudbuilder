package com.cloudbuilder.shared.security;

import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
@Profile("dev")
public class DevAuthController {

    private final JwtTokenProvider jwtTokenProvider;

    public DevAuthController(JwtTokenProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @PostMapping("/register")
    public ResponseEntity<LoginResponse> register(@RequestBody RegisterRequest request) {
        var userId = UUID.randomUUID().toString();
        var email = request.email();
        var name = request.name() != null ? request.name() : email.split("@")[0];
        var roles = Set.of("ADMIN", "USER");

        var token = jwtTokenProvider.generateAccessToken(userId, email, roles);
        var refreshToken = jwtTokenProvider.generateRefreshToken(userId);
        var tenantId = UUID.randomUUID().toString();

        return ResponseEntity.status(HttpStatus.CREATED).body(new LoginResponse(
            token, refreshToken, 900000,
            userId, name, email, roles,
            tenantId, request.tenantName() != null ? request.tenantName() : "Organização Dev",
            request.tenantSlug() != null ? request.tenantSlug() : "dev-org"
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        var userId = UUID.randomUUID().toString();
        var email = request.email();
        var roles = Set.of("ADMIN", "USER");
        var tenantId = UUID.randomUUID().toString();

        var token = jwtTokenProvider.generateAccessToken(userId, email, roles);
        var refreshToken = jwtTokenProvider.generateRefreshToken(userId);

        return ResponseEntity.ok(new LoginResponse(token, refreshToken, 900000,
                userId.toString(), email.split("@")[0], email, roles,
                tenantId, "Organização Dev", "dev-org"));
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(@RequestBody RefreshRequest request) {
        if (!jwtTokenProvider.validateToken(request.refreshToken())) {
            return ResponseEntity.status(401).build();
        }
        var userId = jwtTokenProvider.getUserId(request.refreshToken());
        var email = "dev@cloudbuilder.com";
        var roles = Set.of("ADMIN", "USER");
        var tenantId = UUID.randomUUID().toString();

        var token = jwtTokenProvider.generateAccessToken(userId, email, roles);
        var refreshToken = jwtTokenProvider.generateRefreshToken(userId);

        return ResponseEntity.ok(new LoginResponse(token, refreshToken, 900000,
                userId.toString(), "Dev", email, roles,
                tenantId, "Organização Dev", "dev-org"));
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MeResponse> me() {
        return ResponseEntity.ok(new MeResponse("dev-user", "Desenvolvedor",
                "dev@cloudbuilder.com", Set.of("ADMIN", "USER"),
                "dev-tenant", "Organização Dev", "dev-org"));
    }

    record LoginRequest(String email, String password) {}
    record RegisterRequest(String name, String email, String password, String tenantName, String tenantSlug) {}
    record RefreshRequest(String refreshToken) {}
    record LoginResponse(String token, String refreshToken, long expiresIn,
                         String userId, String name, String email, Set<String> roles,
                         String tenantId, String tenantName, String tenantSlug) {}
    record MeResponse(String id, String name, String email, Set<String> roles,
                      String tenantId, String tenantName, String tenantSlug) {}
}
