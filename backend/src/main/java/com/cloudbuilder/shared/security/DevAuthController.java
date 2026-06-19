package com.cloudbuilder.shared.security;

import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
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

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        var userId = UUID.randomUUID().toString();
        var email = request.email();
        var roles = Set.of("ADMIN", "USER");

        var token = jwtTokenProvider.generateAccessToken(userId, email, roles);
        var refreshToken = jwtTokenProvider.generateRefreshToken(userId);

        return ResponseEntity.ok(new LoginResponse(token, refreshToken, 900000,
                userId.toString(), email.split("@")[0], email, roles));
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(@RequestBody RefreshRequest request) {
        if (!jwtTokenProvider.validateToken(request.refreshToken())) {
            return ResponseEntity.status(401).build();
        }
        var userId = jwtTokenProvider.getUserId(request.refreshToken());
        var email = "dev@cloudbuilder.com";
        var roles = Set.of("ADMIN", "USER");

        var token = jwtTokenProvider.generateAccessToken(userId, email, roles);
        var refreshToken = jwtTokenProvider.generateRefreshToken(userId);

        return ResponseEntity.ok(new LoginResponse(token, refreshToken, 900000,
                userId.toString(), "Dev", email, roles));
    }

    @GetMapping("/me")
    public ResponseEntity<MeResponse> me() {
        return ResponseEntity.ok(new MeResponse("dev-user", "Desenvolvedor",
                "dev@cloudbuilder.com", Set.of("ADMIN", "USER")));
    }

    record LoginRequest(String email, String password) {}
    record RefreshRequest(String refreshToken) {}
    record LoginResponse(String token, String refreshToken, long expiresIn,
                         String userId, String name, String email, Set<String> roles) {}
    record MeResponse(String id, String name, String email, Set<String> roles) {}
}
