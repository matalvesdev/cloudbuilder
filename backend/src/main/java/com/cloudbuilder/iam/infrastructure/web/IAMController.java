package com.cloudbuilder.iam.infrastructure.web;

import com.cloudbuilder.audit.domain.Audited;
import com.cloudbuilder.iam.domain.model.*;
import com.cloudbuilder.iam.domain.service.IamService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
    public ResponseEntity<User> getUser(@PathVariable String id) {
        return ResponseEntity.ok(iamService.getUser(id));
    }

    @Audited(action = "CREATE_USER", resourceType = "USER", resourceId = "#result?.getId()?.toString()")
    @PostMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> createUser(@RequestBody CreateUserRequest req) {
        var user = iamService.createUser(req.name(), req.email(), req.passwordHash());
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }

    @Audited(action = "ENABLE_USER", resourceType = "USER", resourceId = "#id?.toString()")
    @PostMapping("/users/{id}/enable")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> enableUser(@PathVariable String id) {
        return ResponseEntity.ok(iamService.enableUser(id));
    }

    @Audited(action = "DISABLE_USER", resourceType = "USER", resourceId = "#id?.toString()")
    @PostMapping("/users/{id}/disable")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<User> disableUser(@PathVariable String id) {
        return ResponseEntity.ok(iamService.disableUser(id));
    }

    // --- Tenant Users ---

    @GetMapping("/tenants/{tenantId}/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TenantUser>> listUsersByTenant(@PathVariable String tenantId) {
        return ResponseEntity.ok(iamService.listUsersByTenant(tenantId));
    }

    @PostMapping("/tenants/{tenantId}/users/{userId}/roles/{roleId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> assignRole(@PathVariable String tenantId, @PathVariable String userId, @PathVariable String roleId) {
        iamService.assignRole(tenantId, userId, roleId);
        return ResponseEntity.ok().build();
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
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Tenant>> listTenants() {
        return ResponseEntity.ok(iamService.listTenants());
    }

    @GetMapping("/tenants/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Tenant> getTenant(@PathVariable String id) {
        return ResponseEntity.ok(iamService.getTenant(id));
    }

    @PostMapping("/tenants/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Tenant> activateTenant(@PathVariable String id) {
        return ResponseEntity.ok(iamService.activateTenant(id));
    }

    @PostMapping("/tenants/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Tenant> deactivateTenant(@PathVariable String id) {
        return ResponseEntity.ok(iamService.deactivateTenant(id));
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
    record CreateRoleRequest(String name, String description, String tenantId) {}
    record UpdateRoleRequest(String name, String description) {}
    record CreatePermissionRequest(String action, String resource) {}
    record ValidateAccessRequest(String tenantId, String userId) {}
    record HasPermissionRequest(String tenantId, String userId, String action, String resource) {}
}
