package com.cloudbuilder.iam.infrastructure.web;

import com.cloudbuilder.iam.application.dto.*;
import com.cloudbuilder.iam.domain.service.AuthService;
import com.cloudbuilder.audit.domain.service.AuditService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final AuditService auditService;

    public AuthController(AuthService authService, AuditService auditService) {
        this.authService = authService;
        this.auditService = auditService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request,
                                                  HttpServletRequest httpRequest) {
        var response = authService.register(request);
        auditService.recordEvent(
            response.tenantId(), response.userId(), "REGISTER",
            "USER", response.userId(),
            "Registro de novo usuário: " + response.email(),
            getClientIp(httpRequest)
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request,
                                               HttpServletRequest httpRequest) {
        var response = authService.login(request);
        auditService.recordEvent(
            response.tenantId(), response.userId(), "LOGIN",
            "USER", response.userId(),
            "Login do usuário: " + response.email(),
            getClientIp(httpRequest)
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@RequestBody RefreshRequest request) {
        var response = authService.refresh(request.refreshToken());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<MeResponse> me(Authentication authentication) {
        var userId = (UUID) authentication.getPrincipal();
        var response = authService.getMe(userId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request,
                                                               HttpServletRequest httpRequest) {
        var response = authService.forgotPassword(request);
        auditService.recordEvent(
            "system", request.email(), "FORGOT_PASSWORD",
            "USER", request.email(),
            "Solicitação de redefinição de senha",
            getClientIp(httpRequest)
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request,
                                                              HttpServletRequest httpRequest) {
        var response = authService.resetPassword(request);
        auditService.recordEvent(
            "system", "", "RESET_PASSWORD",
            "USER", "",
            "Senha redefinida com sucesso",
            getClientIp(httpRequest)
        );
        return ResponseEntity.ok(response);
    }

    private String getClientIp(HttpServletRequest request) {
        var xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        var xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isBlank()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }

    record RefreshRequest(String refreshToken) {}
}
