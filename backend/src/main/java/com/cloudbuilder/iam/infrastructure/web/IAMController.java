package com.cloudbuilder.iam.infrastructure.web;

import com.cloudbuilder.iam.domain.model.*;
import com.cloudbuilder.iam.domain.service.IamService;
import com.cloudbuilder.iam.domain.service.MfaService;
import com.cloudbuilder.iam.domain.service.SessionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/v1/iam")
@PreAuthorize("isAuthenticated()")
public class IAMController {

    private final IamService iamService;
    private final MfaService mfaService;
    private final SessionService sessionService;

    public IAMController(IamService iamService, MfaService mfaService, SessionService sessionService) {
        this.iamService = iamService;
        this.mfaService = mfaService;
        this.sessionService = sessionService;
    }

    // --- Users ---

    @GetMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> getUser(@PathVariable String id) {
        requireUserInCurrentTenant(id);
        return ResponseEntity.ok(iamService.getUser(id));
    }

    @GetMapping("/users/{id}/permissions")
    @PreAuthorize("hasRole('ADMIN') or #id == authentication.principal")
    public ResponseEntity<List<IamService.UserPermissionsDTO>> getUserPermissions(@PathVariable String id) {
        return ResponseEntity.ok(iamService.getUserPermissions(id));
    }

    @GetMapping("/users/{id}/tenants")
    @PreAuthorize("hasRole('ADMIN') or #id == authentication.name")
    public ResponseEntity<List<IamService.UserTenantInfoDTO>> getUserTenants(@PathVariable String id) {
        return ResponseEntity.ok(iamService.listTenantsByUser(id));
    }

    @PostMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> createUser(@RequestBody CreateUserRequest req) {
        var tenantUser = iamService.createUserInTenant(
                req.tenantId(), req.name(), req.email(), req.password(), req.roleId());
        var user = iamService.getUser(tenantUser.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }

    @PostMapping("/users/{id}/enable")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> enableUser(@PathVariable String id) {
        requireUserInCurrentTenant(id);
        return ResponseEntity.ok(iamService.enableUser(id));
    }

    @PostMapping("/users/{id}/disable")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> disableUser(@PathVariable String id) {
        requireUserInCurrentTenant(id);
        return ResponseEntity.ok(iamService.disableUser(id));
    }

    // --- Tenant Users ---

    @GetMapping("/tenants/{tenantId}/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<IamService.TenantUserInfoDTO>> listUsersByTenant(@PathVariable String tenantId) {
        return ResponseEntity.ok(iamService.listUsersByTenant(tenantId));
    }

    @PostMapping("/tenants/{tenantId}/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TenantUser> createUserInTenant(
            @PathVariable String tenantId,
            @RequestBody CreateUserInTenantRequest req) {
        var tenantUser = iamService.createUserInTenant(
            tenantId, req.name(), req.email(), req.password(), req.roleId());
        return ResponseEntity.status(HttpStatus.CREATED).body(tenantUser);
    }

    @PostMapping("/tenants/{tenantId}/users/{userId}/roles/{roleId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> assignRole(@PathVariable String tenantId, @PathVariable String userId, @PathVariable String roleId) {
        iamService.assignRole(tenantId, userId, roleId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/tenants/{tenantId}/users/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> removeUserFromTenant(@PathVariable String tenantId, @PathVariable String userId) {
        iamService.removeUserFromTenant(tenantId, userId);
        return ResponseEntity.noContent().build();
    }

    // --- Roles ---

    @GetMapping("/tenants/{tenantId}/roles")
    public ResponseEntity<List<Role>> listRoles(@PathVariable String tenantId) {
        return ResponseEntity.ok(iamService.listRolesByTenant(tenantId));
    }

    @PostMapping("/roles")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Role> createRole(@RequestBody CreateRoleRequest req) {
        var role = iamService.createRole(req.tenantId(), req.name(), req.description());
        return ResponseEntity.status(HttpStatus.CREATED).body(role);
    }

    @PutMapping("/roles/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Role> updateRole(@PathVariable String id, @RequestBody UpdateRoleRequest req) {
        var role = iamService.updateRole(id, req.name(), req.description());
        return ResponseEntity.ok(role);
    }

    @DeleteMapping("/roles/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteRole(@PathVariable String id) {
        iamService.deleteRole(id);
        return ResponseEntity.noContent().build();
    }

    // --- Permissions ---

    @GetMapping("/roles/{roleId}/permissions")
    public ResponseEntity<List<Permission>> listPermissions(@PathVariable String roleId) {
        return ResponseEntity.ok(iamService.listPermissionsByRole(roleId));
    }

    @PostMapping("/roles/{roleId}/permissions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Permission> createPermission(@PathVariable String roleId, @RequestBody CreatePermissionRequest req) {
        var permission = iamService.createPermission(roleId, req.action(), req.resource());
        return ResponseEntity.status(HttpStatus.CREATED).body(permission);
    }

    @DeleteMapping("/permissions/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deletePermission(@PathVariable String id) {
        iamService.deletePermission(id);
        return ResponseEntity.noContent().build();
    }

    // --- Tenant Management ---

    @GetMapping("/tenants")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Tenant>> listTenants(Authentication authentication) {
        return ResponseEntity.ok(iamService.listTenantsForUser(authentication.getName()));
    }

    @PostMapping("/tenants")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Tenant> createTenant(@RequestBody CreateTenantRequest req) {
        var tenant = iamService.createTenant(req.name(), req.slug());
        return ResponseEntity.status(HttpStatus.CREATED).body(tenant);
    }

    @GetMapping("/tenants/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Tenant> getTenant(@PathVariable String id) {
        requireCurrentTenant(id);
        return ResponseEntity.ok(iamService.getTenant(id));
    }

    @PostMapping("/tenants/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Tenant> activateTenant(@PathVariable String id) {
        requireCurrentTenant(id);
        return ResponseEntity.ok(iamService.activateTenant(id));
    }

    @PostMapping("/tenants/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Tenant> deactivateTenant(@PathVariable String id) {
        requireCurrentTenant(id);
        return ResponseEntity.ok(iamService.deactivateTenant(id));
    }

    // --- Validation ---

    @PostMapping("/validate/tenant-access")
    @PreAuthorize("hasRole('ADMIN') or #req.userId() == authentication.name")
    public ResponseEntity<Boolean> validateTenantAccess(@RequestBody ValidateAccessRequest req) {
        requireCurrentTenant(req.tenantId());
        return ResponseEntity.ok(iamService.validateTenantAccess(req.tenantId(), req.userId()));
    }

    @PostMapping("/validate/permission")
    @PreAuthorize("hasRole('ADMIN') or #req.userId() == authentication.name")
    public ResponseEntity<Boolean> hasPermission(@RequestBody HasPermissionRequest req) {
        requireCurrentTenant(req.tenantId());
        return ResponseEntity.ok(iamService.hasPermission(req.tenantId(), req.userId(), req.action(), req.resource()));
    }

    // ── MFA endpoints ─────────────────────────────────────────────────

    @PostMapping("/mfa/setup/{userId}")
    @PreAuthorize("hasRole('ADMIN') or #userId == authentication.name")
    public ResponseEntity<MfaResponse> setupMfa(@PathVariable String userId) {
        return ResponseEntity.ok(MfaResponse.setup(mfaService.setupMfa(userId)));
    }

    @PostMapping("/mfa/verify-and-enable/{userId}")
    @PreAuthorize("hasRole('ADMIN') or #userId == authentication.name")
    public ResponseEntity<MfaResponse> verifyAndEnableMfa(@PathVariable String userId,
                                                          @RequestBody VerifyMfaRequest req) {
        return ResponseEntity.ok(MfaResponse.enabled(mfaService.verifyAndEnable(userId, req.code())));
    }

    @PostMapping("/mfa/verify/{userId}")
    @PreAuthorize("hasRole('ADMIN') or #userId == authentication.name")
    public ResponseEntity<Boolean> verifyMfa(@PathVariable String userId,
                                              @RequestBody VerifyMfaRequest req) {
        return ResponseEntity.ok(mfaService.verify(userId, req.code()));
    }

    @PostMapping("/mfa/disable/{userId}")
    @PreAuthorize("hasRole('ADMIN') or #userId == authentication.name")
    public ResponseEntity<Void> disableMfa(@PathVariable String userId) {
        mfaService.disableMfa(userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/mfa/status/{userId}")
    @PreAuthorize("hasRole('ADMIN') or #userId == authentication.name")
    public ResponseEntity<MfaResponse> getMfaStatus(@PathVariable String userId) {
        var mfa = mfaService.getMfaStatus(userId);
        if (mfa == null) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.ok(MfaResponse.status(mfa));
    }

    // ── Session endpoints ─────────────────────────────────────────────

    @GetMapping("/sessions/user/{userId}/active")
    @PreAuthorize("hasRole('ADMIN') or #userId == authentication.name")
    public ResponseEntity<List<Session>> getActiveSessions(@PathVariable String userId) {
        return ResponseEntity.ok(sessionService.getActiveSessionsByUser(userId));
    }

    @GetMapping("/sessions/user/{userId}")
    @PreAuthorize("hasRole('ADMIN') or #userId == authentication.name")
    public ResponseEntity<List<Session>> getAllSessions(@PathVariable String userId) {
        return ResponseEntity.ok(sessionService.getAllSessionsByUser(userId));
    }

    @PostMapping("/sessions/{sessionId}/terminate")
    public ResponseEntity<Void> terminateSession(@PathVariable String sessionId,
                                                 Authentication authentication) {
        var session = sessionService.getSession(sessionId);
        requireSelfOrAdmin(session.getUserId(), authentication);
        sessionService.terminateSession(sessionId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/sessions/user/{userId}/terminate-all")
    @PreAuthorize("hasRole('ADMIN') or #userId == authentication.name")
    public ResponseEntity<Void> terminateAllSessions(@PathVariable String userId) {
        sessionService.terminateAllUserSessions(userId);
        return ResponseEntity.ok().build();
    }

    // --- Requests ---

    record CreateUserRequest(String name, String email, String password, String tenantId, String roleId) {}
    record CreateRoleRequest(String name, String description, String tenantId) {}
    record UpdateRoleRequest(String name, String description) {}
    record CreatePermissionRequest(String action, String resource) {}
    record CreateTenantRequest(String name, String slug) {}
    record CreateUserInTenantRequest(String name, String email, String password, String roleId) {}
    record ValidateAccessRequest(String tenantId, String userId) {}
    record HasPermissionRequest(String tenantId, String userId, String action, String resource) {}

    // MFA records
    record VerifyMfaRequest(String code) {}

    record MfaResponse(
            boolean enabled,
            String method,
            boolean verified,
            String secretKey,
            String qrCode,
            List<String> backupCodes
    ) {
        static MfaResponse setup(UserMfa mfa) {
            return new MfaResponse(
                    false, "totp", false, mfa.getSecret(), "",
                    splitBackupCodes(mfa.getBackupCodes()));
        }

        static MfaResponse enabled(UserMfa mfa) {
            return new MfaResponse(
                    true, "totp", true, null, null,
                    splitBackupCodes(mfa.getBackupCodes()));
        }

        static MfaResponse status(UserMfa mfa) {
            return new MfaResponse(
                    mfa.isEnabled(), "totp", mfa.isEnabled(), null, null, List.of());
        }

        private static List<String> splitBackupCodes(String backupCodes) {
            return backupCodes == null || backupCodes.isBlank()
                    ? List.of()
                    : Arrays.asList(backupCodes.split(","));
        }
    }

    private void requireUserInCurrentTenant(String userId) {
        String tenantId = com.cloudbuilder.shared.security.TenantContext.getTenantId();
        if (tenantId == null || !iamService.validateTenantAccess(tenantId, userId)) {
            throw new AccessDeniedException("O usuário não pertence ao tenant ativo");
        }
    }

    private static void requireCurrentTenant(String tenantId) {
        String currentTenantId = com.cloudbuilder.shared.security.TenantContext.getTenantId();
        if (currentTenantId == null || !currentTenantId.equals(tenantId)) {
            throw new AccessDeniedException("O recurso não pertence ao tenant ativo");
        }
    }

    private static void requireSelfOrAdmin(String userId, Authentication authentication) {
        boolean admin = authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN"));
        if (!admin && !authentication.getName().equals(userId)) {
            throw new AccessDeniedException("A sessão não pertence ao usuário autenticado");
        }
    }
}
