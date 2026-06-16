package com.cloudbuilder.iam.domain.service;

import com.cloudbuilder.iam.application.dto.*;
import com.cloudbuilder.iam.domain.model.*;
import com.cloudbuilder.iam.domain.port.*;
import com.cloudbuilder.shared.security.JwtTokenProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final SecureRandom secureRandom = new SecureRandom();

    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final TenantUserRepository tenantUserRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;

    private static final String[] SYSTEM_RESOURCES = {
        "CANVAS", "PROVISION", "COST", "OBSERVE", "PLATFORM", "IAM", "AUDIT", "SETTINGS"
    };

    public AuthService(UserRepository userRepository,
                       TenantRepository tenantRepository,
                       TenantUserRepository tenantUserRepository,
                       RoleRepository roleRepository,
                       PermissionRepository permissionRepository,
                       PasswordResetTokenRepository passwordResetTokenRepository,
                       JwtTokenProvider jwtTokenProvider,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.tenantRepository = tenantRepository;
        this.tenantUserRepository = tenantUserRepository;
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.jwtTokenProvider = jwtTokenProvider;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.findByEmail(request.email()).isPresent()) {
            throw new RuntimeException("E-mail já cadastrado.");
        }
        if (tenantRepository.findBySlug(request.tenantSlug()).isPresent()) {
            throw new RuntimeException("Slug da organização já está em uso.");
        }

        // Create tenant
        var tenant = new Tenant(request.tenantName(), request.tenantSlug());
        tenant = tenantRepository.save(tenant);

        // Create default roles for the tenant
        var adminRole = createSystemRole(tenant.getId(), "admin", "Administrador com acesso total");
        var editorRole = createSystemRole(tenant.getId(), "editor", "Editor com permissões de leitura e escrita");
        var viewerRole = createSystemRole(tenant.getId(), "viewer", "Visualizador com acesso somente leitura");

        // Create user
        var user = new User(request.email(), passwordEncoder.encode(request.password()), request.name());
        user = userRepository.save(user);

        // Link user to tenant as admin
        var tenantUser = new TenantUser(tenant.getId(), user.getId(), adminRole.getId());
        tenantUserRepository.save(tenantUser);

        return buildAuthResponse(user, tenant, adminRole);
    }

    public AuthResponse login(LoginRequest request) {
        var user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new RuntimeException("Credenciais inválidas."));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new RuntimeException("Credenciais inválidas.");
        }

        if (!user.isEnabled()) {
            throw new RuntimeException("Usuário desativado.");
        }

        // Find the user's tenant
        var tenantUsers = tenantUserRepository.findByUserId(user.getId());
        if (tenantUsers.isEmpty()) {
            throw new RuntimeException("Usuário não vinculado a nenhuma organização.");
        }

        var tu = tenantUsers.get(0);
        var tenant = tenantRepository.findById(tu.getTenantId())
                .orElseThrow(() -> new RuntimeException("Organização não encontrada."));

        var role = roleRepository.findById(tu.getRoleId()).orElse(null);

        return buildAuthResponse(user, tenant, role);
    }

    public AuthResponse refresh(String refreshToken) {
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new RuntimeException("Token de refresh inválido ou expirado.");
        }
        var userId = jwtTokenProvider.getUserId(refreshToken);
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado."));

        var tenantUsers = tenantUserRepository.findByUserId(user.getId());
        if (tenantUsers.isEmpty()) {
            throw new RuntimeException("Usuário não vinculado a nenhuma organização.");
        }

        var tu = tenantUsers.get(0);
        var tenant = tenantRepository.findById(tu.getTenantId())
                .orElseThrow(() -> new RuntimeException("Organização não encontrada."));

        var role = roleRepository.findById(tu.getRoleId()).orElse(null);

        return buildAuthResponse(user, tenant, role);
    }

    public MeResponse getMe(UUID userId) {
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado."));

        var tenantUsers = tenantUserRepository.findByUserId(user.getId());
        if (tenantUsers.isEmpty()) {
            return new MeResponse(user.getId().toString(), user.getName(), user.getEmail(), Set.of(), null, null, null);
        }

        var tu = tenantUsers.get(0);
        var tenant = tenantRepository.findById(tu.getTenantId()).orElse(null);

        var role = roleRepository.findById(tu.getRoleId()).orElse(null);
        java.util.Set<String> roles = role != null ? Set.of(role.getName()) : Set.of();
        var tenantName = tenant != null ? tenant.getName() : null;
        var tenantSlug = tenant != null ? tenant.getSlug() : null;

        return new MeResponse(user.getId().toString(), user.getName(), user.getEmail(), roles,
                tu.getTenantId().toString(), tenantName, tenantSlug);
    }

    @Transactional
    public Map<String, String> forgotPassword(ForgotPasswordRequest request) {
        var userOpt = userRepository.findByEmail(request.email());
        if (userOpt.isEmpty()) {
            // Não revela se o email existe ou não por segurança
            log.info("Password reset requested for unknown email: {}", request.email());
            return Map.of("message", "Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.");
        }

        var user = userOpt.get();
        // Invalida tokens anteriores
        passwordResetTokenRepository.deleteByUserId(user.getId());

        // Gera token de 32 caracteres hex
        var tokenBytes = new byte[32];
        secureRandom.nextBytes(tokenBytes);
        var sb = new StringBuilder();
        for (byte b : tokenBytes) sb.append(String.format("%02x", b));
        var token = sb.toString();

        var resetToken = new PasswordResetToken(user.getId(), token, Instant.now().plusSeconds(3600));
        passwordResetTokenRepository.save(resetToken);

        // Em produção, enviaria email. Em dev, loga o link.
        log.info("=== PASSWORD RESET TOKEN (dev only) ===");
        log.info("Email: {} | Token: {}", request.email(), token);
        log.info("Link: http://localhost:5173/?authMode=reset-password&token={}", token);
        log.info("========================================");

        return Map.of("message", "Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.");
    }

    @Transactional
    public Map<String, String> resetPassword(ResetPasswordRequest request) {
        var resetTokenOpt = passwordResetTokenRepository.findByToken(request.token());
        if (resetTokenOpt.isEmpty() || !resetTokenOpt.get().isValid()) {
            throw new RuntimeException("Token inválido ou expirado. Solicite um novo reset de senha.");
        }

        var resetToken = resetTokenOpt.get();
        var user = userRepository.findById(resetToken.getUserId())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado."));

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        log.info("Senha redefinida com sucesso para o usuário: {}", user.getEmail());

        return Map.of("message", "Senha redefinida com sucesso. Faça login com sua nova senha.");
    }

    private AuthResponse buildAuthResponse(User user, Tenant tenant, Role role) {
        var roles = role != null ? Set.of(role.getName()) : Set.of("USER");
        var token = jwtTokenProvider.generateAccessToken(user.getId(), user.getEmail(), roles, tenant.getId().toString());
        var refreshToken = jwtTokenProvider.generateRefreshToken(user.getId());

        return new AuthResponse(
            token, refreshToken, 900000,
            user.getId().toString(), user.getName(), user.getEmail(), roles,
            tenant.getId().toString(), tenant.getName(), tenant.getSlug()
        );
    }

    private Role createSystemRole(UUID tenantId, String name, String description) {
        var role = new Role(tenantId, name, description, true);
        role = roleRepository.save(role);
        createPermissionsForRole(role.getId(), name);
        return role;
    }

    private void createPermissionsForRole(UUID roleId, String roleName) {
        for (String resource : SYSTEM_RESOURCES) {
            switch (roleName) {
                case "admin" -> {
                    savePermission(roleId, "CREATE", resource);
                    savePermission(roleId, "READ", resource);
                    savePermission(roleId, "UPDATE", resource);
                    savePermission(roleId, "DELETE", resource);
                    savePermission(roleId, "DEPLOY", resource);
                    savePermission(roleId, "MANAGE", resource);
                }
                case "editor" -> {
                    savePermission(roleId, "CREATE", resource);
                    savePermission(roleId, "READ", resource);
                    savePermission(roleId, "UPDATE", resource);
                    savePermission(roleId, "DELETE", resource);
                    savePermission(roleId, "DEPLOY", resource);
                }
                case "viewer" -> {
                    savePermission(roleId, "READ", resource);
                }
            }
        }
    }

    private void savePermission(UUID roleId, String action, String resource) {
        permissionRepository.save(new Permission(roleId, action, resource));
    }
}
