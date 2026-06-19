package com.cloudbuilder.iam.domain.service;

import com.cloudbuilder.iam.application.dto.*;
import com.cloudbuilder.iam.domain.model.*;
import com.cloudbuilder.iam.domain.port.*;
import com.cloudbuilder.shared.security.JwtTokenProviderStub;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class AuthServiceTest {

    private UserRepository userRepository;
    private TenantRepository tenantRepository;
    private TenantUserRepository tenantUserRepository;
    private RoleRepository roleRepository;
    private PermissionRepository permissionRepository;
    private PasswordResetTokenRepository passwordResetTokenRepository;
    private JwtTokenProviderStub jwtTokenProvider;
    private PasswordEncoder passwordEncoder;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        tenantRepository = mock(TenantRepository.class);
        tenantUserRepository = mock(TenantUserRepository.class);
        roleRepository = mock(RoleRepository.class);
        permissionRepository = mock(PermissionRepository.class);
        passwordResetTokenRepository = mock(PasswordResetTokenRepository.class);
        jwtTokenProvider = new JwtTokenProviderStub();
        passwordEncoder = mock(PasswordEncoder.class);

        authService = new AuthService(userRepository, tenantRepository, tenantUserRepository,
                roleRepository, permissionRepository, passwordResetTokenRepository,
                jwtTokenProvider, passwordEncoder);
    }

    @Test
    void register_WithValidData_ShouldCreateTenantAndUser() {
        var request = new RegisterRequest("user@test.com", "pass123", "Test User",
                "Test Org", "test-org");
        when(userRepository.findByEmail(request.email())).thenReturn(Optional.empty());
        when(tenantRepository.findBySlug(request.tenantSlug())).thenReturn(Optional.empty());
        when(tenantRepository.save(any(Tenant.class))).thenAnswer(i -> i.getArgument(0));
        when(roleRepository.save(any(Role.class))).thenAnswer(i -> i.getArgument(0));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));
        when(tenantUserRepository.save(any(TenantUser.class))).thenAnswer(i -> i.getArgument(0));
        when(passwordEncoder.encode(anyString())).thenReturn("encoded-pass");

        var result = authService.register(request);

        assertNotNull(result);
        assertEquals("access-token", result.token());
        assertEquals("refresh-token", result.refreshToken());
        assertEquals("Test Org", result.tenantName());
        verify(userRepository).save(any(User.class));
        verify(tenantRepository).save(any(Tenant.class));
        verify(tenantUserRepository).save(any(TenantUser.class));
    }

    @Test
    void register_WithDuplicateEmail_ShouldThrow() {
        var request = new RegisterRequest("dup@test.com", "pass123", "Dup",
                "Org", "org");
        when(userRepository.findByEmail(request.email())).thenReturn(Optional.of(new User("dup@test.com", "pass", "Dup")));

        var ex = assertThrows(RuntimeException.class, () -> authService.register(request));
        assertTrue(ex.getMessage().contains("E-mail já cadastrado"));
    }

    @Test
    void register_WithDuplicateSlug_ShouldThrow() {
        var request = new RegisterRequest("u@test.com", "pass", "U",
                "Org", "dup-slug");
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        when(tenantRepository.findBySlug(request.tenantSlug())).thenReturn(Optional.of(new Tenant()));

        var ex = assertThrows(RuntimeException.class, () -> authService.register(request));
        assertTrue(ex.getMessage().contains("Slug"));
    }

    @Test
    void login_WithValidCredentials_ShouldReturnAuthResponse() {
        var request = new LoginRequest("user@test.com", "correct-password");
        var user = new User("user@test.com", "encoded-pass", "Test User");
        var tenant = new Tenant("Org", "org");
        var role = new Role(tenant.getId(), "admin", "Admin", true);
        var tenantUser = new TenantUser(tenant.getId(), user.getId(), role.getId());

        when(userRepository.findByEmail(request.email())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(request.password(), user.getPasswordHash())).thenReturn(true);
        when(tenantUserRepository.findByUserId(user.getId())).thenReturn(List.of(tenantUser));
        when(tenantRepository.findById(tenant.getId())).thenReturn(Optional.of(tenant));
        when(roleRepository.findById(role.getId())).thenReturn(Optional.of(role));

        var result = authService.login(request);

        assertNotNull(result);
        assertEquals("access-token", result.token());
        assertEquals("Test User", result.name());
    }

    @Test
    void login_WithInvalidPassword_ShouldThrow() {
        var request = new LoginRequest("user@test.com", "wrong");
        var user = new User("user@test.com", "encoded", "U");
        when(userRepository.findByEmail(request.email())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(request.password(), user.getPasswordHash())).thenReturn(false);

        assertThrows(RuntimeException.class, () -> authService.login(request));
    }

    @Test
    void login_WithDisabledUser_ShouldThrow() {
        var request = new LoginRequest("disabled@test.com", "pass");
        var user = new User("disabled@test.com", "encoded", "Disabled");
        user.setEnabled(false);
        when(userRepository.findByEmail(request.email())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);

        assertThrows(RuntimeException.class, () -> authService.login(request));
    }

    @Test
    void refresh_WithValidToken_ShouldReturnNewAuth() {
        var user = new User("u@test.com", "encoded", "User");
        var knownUserId = user.getId();
        var tenant = new Tenant("Org", "org");
        var role = new Role(tenant.getId(), "admin", "Admin", true);
        var tenantUser = new TenantUser(tenant.getId(), knownUserId, role.getId());

        jwtTokenProvider.setUserId(knownUserId);
        jwtTokenProvider.setAccessToken("new-access");
        jwtTokenProvider.setRefreshToken("new-refresh");

        when(userRepository.findById(knownUserId)).thenReturn(Optional.of(user));
        when(tenantUserRepository.findByUserId(knownUserId)).thenReturn(List.of(tenantUser));
        when(tenantRepository.findById(tenant.getId())).thenReturn(Optional.of(tenant));
        when(roleRepository.findById(role.getId())).thenReturn(Optional.of(role));

        var result = authService.refresh("valid-refresh");
        assertEquals("new-access", result.token());
    }

    @Test
    void refresh_WithInvalidToken_ShouldThrow() {
        jwtTokenProvider.setValidateTokenResult(false);
        assertThrows(RuntimeException.class, () -> authService.refresh("invalid"));
    }

    @Test
    void getMe_WithValidUser_ShouldReturnMeResponse() {
        var user = new User("u@test.com", "encoded", "User");
        var knownId = user.getId();
        var tenant = new Tenant("Org", "org");
        var role = new Role(tenant.getId(), "admin", "Admin", true);
        var tenantUser = new TenantUser(tenant.getId(), knownId, role.getId());

        when(userRepository.findById(knownId)).thenReturn(Optional.of(user));
        when(tenantUserRepository.findByUserId(knownId)).thenReturn(List.of(tenantUser));
        when(tenantRepository.findById(tenant.getId())).thenReturn(Optional.of(tenant));
        when(roleRepository.findById(role.getId())).thenReturn(Optional.of(role));

        var result = authService.getMe(knownId);
        assertEquals("User", result.name());
        assertEquals("u@test.com", result.email());
        assertTrue(result.roles().contains("admin"));
    }

    @Test
    void updateProfile_ShouldUpdateName() {
        var user = new User("u@test.com", "encoded", "Old Name");
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        var result = authService.updateProfile(user.getId(), "New Name");
        assertEquals("New Name", result.getName());
    }

    @Test
    void forgotPassword_WithExistingEmail_ShouldCreateToken() {
        var user = new User("u@test.com", "encoded", "U");
        when(userRepository.findByEmail("u@test.com")).thenReturn(Optional.of(user));

        var result = authService.forgotPassword(new ForgotPasswordRequest("u@test.com"));
        assertTrue(result.containsKey("message"));
        verify(passwordResetTokenRepository).deleteByUserId(user.getId());
        verify(passwordResetTokenRepository).save(any(PasswordResetToken.class));
    }

    @Test
    void forgotPassword_WithUnknownEmail_ShouldReturnGenericMessage() {
        when(userRepository.findByEmail("unknown@test.com")).thenReturn(Optional.empty());

        var result = authService.forgotPassword(new ForgotPasswordRequest("unknown@test.com"));
        assertTrue(result.containsKey("message"));
        verify(passwordResetTokenRepository, never()).save(any());
    }

    @Test
    void resetPassword_WithValidToken_ShouldUpdatePassword() {
        var user = new User("u@test.com", "old-encoded", "U");
        var userId = user.getId();
        var resetToken = new PasswordResetToken(userId, "valid-token", Instant.now().plusSeconds(3600));

        when(passwordResetTokenRepository.findByToken("valid-token")).thenReturn(Optional.of(resetToken));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("new-pass")).thenReturn("new-encoded");
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        var result = authService.resetPassword(new ResetPasswordRequest("valid-token", "new-pass"));
        assertTrue(result.containsKey("message"));
        assertEquals("new-encoded", user.getPasswordHash());
        assertTrue(resetToken.isUsed());
    }

    @Test
    void resetPassword_WithExpiredToken_ShouldThrow() {
        var resetToken = new PasswordResetToken(UUID.randomUUID().toString(), "expired",
                Instant.now().minusSeconds(3600));
        when(passwordResetTokenRepository.findByToken("expired")).thenReturn(Optional.of(resetToken));

        assertThrows(RuntimeException.class,
                () -> authService.resetPassword(new ResetPasswordRequest("expired", "new-pass")));
    }
}
