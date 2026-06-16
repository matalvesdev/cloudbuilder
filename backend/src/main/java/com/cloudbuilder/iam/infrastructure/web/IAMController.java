package com.cloudbuilder.iam.infrastructure.web;

import com.cloudbuilder.iam.domain.model.*;
import com.cloudbuilder.iam.domain.service.IamService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/iam")
@PreAuthorize("isAuthenticated()")
public class IAMController {

    private final IamService iamService;

    public IAMController(IamService iamService) {
        this.iamService = iamService;
    }

    // --- Users ---

    @GetMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> getUser(@PathVariable UUID id) {
        return ResponseEntity.ok(iamService.getUser(id));
    }

    @PostMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> createUser(@RequestBody CreateUserRequest req) {
        var user = iamService.createUser(req.name(), req.email(), req.passwordHash());
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }

    @PostMapping("/users/{id}/enable")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> enableUser(@PathVariable UUID id) {
        return ResponseEntity.ok(iamService.enableUser(id));
    }

    @PostMapping("/users/{id}/disable")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> disableUser(@PathVariable UUID id) {
        return ResponseEntity.ok(iamService.disableUser(id));
    }

    // --- Tenant Users ---

    @GetMapping("/tenants/{tenantId}/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TenantUser>> listUsersByTenant(@PathVariable UUID tenantId) {
        return ResponseEntity.ok(iamService.listUsersByTenant(tenantId));
    }

    @PostMapping("/tenants/{tenantId}/users/{userId}/roles/{roleId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> assignRole(@PathVariable UUID tenantId, @PathVariable UUID userId, @PathVariable UUID roleId) {
        iamService.assignRole(tenantId, userId, roleId);
        return ResponseEntity.ok().build();
    }

    // --- Roles ---

    @GetMapping("/tenants/{tenantId}/roles")
    public ResponseEntity<List<Role>> listRoles(@PathVariable UUID tenantId) {
        return ResponseEntity.ok(iamService.listRolesByTenant(tenantId));
    }

    @PostMapping("/roles")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Role> createRole(@RequestBody CreateRoleRequest req) {
        var role = iamService.createRole(req.tenantId(), req.name(), req.description());
        return ResponseEntity.status(HttpStatus.CREATED).body(role);
    }

    @DeleteMapping("/roles/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteRole(@PathVariable UUID id) {
        iamService.deleteRole(id);
        return ResponseEntity.noContent().build();
    }

    // --- Permissions ---

    @GetMapping("/roles/{roleId}/permissions")
    public ResponseEntity<List<Permission>> listPermissions(@PathVariable UUID roleId) {
        return ResponseEntity.ok(iamService.listPermissionsByRole(roleId));
    }

    // --- Validation ---

    @PostMapping("/validate/tenant-access")
    public ResponseEntity<Boolean> validateTenantAccess(@RequestBody ValidateAccessRequest req) {
        return ResponseEntity.ok(iamService.validateTenantAccess(req.tenantId(), req.userId()));
    }

    @PostMapping("/validate/permission")
    public ResponseEntity<Boolean> hasPermission(@RequestBody HasPermissionRequest req) {
        return ResponseEntity.ok(iamService.hasPermission(req.tenantId(), req.userId(), req.action(), req.resource()));
    }

    // --- Requests ---

    record CreateUserRequest(String name, String email, String passwordHash) {}
    record CreateRoleRequest(String name, String description, UUID tenantId) {}
    record ValidateAccessRequest(UUID tenantId, UUID userId) {}
    record HasPermissionRequest(UUID tenantId, UUID userId, String action, String resource) {}
}
