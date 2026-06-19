package com.cloudbuilder.iam.domain.service;

import com.cloudbuilder.iam.domain.model.*;
import com.cloudbuilder.iam.domain.port.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
@Service
@Transactional
public class IamService {

    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final TenantUserRepository tenantUserRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;

    public IamService(UserRepository userRepository,
                      TenantRepository tenantRepository,
                      TenantUserRepository tenantUserRepository,
                      RoleRepository roleRepository,
                      PermissionRepository permissionRepository) {
        this.userRepository = userRepository;
        this.tenantRepository = tenantRepository;
        this.tenantUserRepository = tenantUserRepository;
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
    }

    // --- Users ---

    public User createUser(String name, String email, String passwordHash) {
        var user = new User(email, passwordHash, name);
        return userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public User getUser(String id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado: " + id));
    }

    public User enableUser(String id) {
        var user = getUser(id);
        user.setEnabled(true);
        user.setUpdatedAt(Instant.now());
        return userRepository.save(user);
    }

    public User disableUser(String id) {
        var user = getUser(id);
        user.setEnabled(false);
        user.setUpdatedAt(Instant.now());
        return userRepository.save(user);
    }

    // --- Tenant Users ---

    @Transactional(readOnly = true)
    public List<TenantUser> listUsersByTenant(String tenantId) {
        return tenantUserRepository.findByTenantId(tenantId);
    }

    @Transactional(readOnly = true)
    public List<TenantUser> listTenantsByUser(String userId) {
        return tenantUserRepository.findByUserId(userId);
    }

    public void assignRole(String tenantId, String userId, String roleId) {
        var tu = tenantUserRepository.findByTenantIdAndUserId(tenantId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado no tenant"));
        tu.setRoleId(roleId);
        tenantUserRepository.save(tu);
    }

    // --- Roles ---

    public Role createRole(String tenantId, String name, String description) {
        var existing = roleRepository.findByTenantIdAndName(tenantId, name);
        if (existing.isPresent()) {
            throw new IllegalArgumentException("Role já existe neste tenant: " + name);
        }
        var role = new Role(tenantId, name, description, false);
        return roleRepository.save(role);
    }

    @Transactional(readOnly = true)
    public List<Role> listRolesByTenant(String tenantId) {
        return roleRepository.findByTenantId(tenantId);
    }

    @Transactional(readOnly = true)
    public Role getRole(String id) {
        return roleRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Role não encontrada: " + id));
    }

    public void deleteRole(String id) {
        var role = getRole(id);
        if (role.isSystemRole()) {
            throw new IllegalArgumentException("Roles de sistema não podem ser removidas.");
        }
        permissionRepository.findByRoleId(id).forEach(permissionRepository::delete);
        roleRepository.delete(role);
    }

    public Role updateRole(String id, String name, String description) {
        var role = getRole(id);
        if (role.isSystemRole()) {
            throw new IllegalArgumentException("Roles de sistema não podem ser alteradas.");
        }
        role.setName(name);
        role.setDescription(description);
        return roleRepository.save(role);
    }

    // --- Permissions ---

    @Transactional(readOnly = true)
    public List<Permission> listPermissionsByRole(String roleId) {
        return permissionRepository.findByRoleId(roleId);
    }

    public Permission createPermission(String roleId, String action, String resource) {
        getRole(roleId);
        var permission = new Permission(roleId, action, resource);
        return permissionRepository.save(permission);
    }

    public void deletePermission(String id) {
        permissionRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public boolean hasPermission(String tenantId, String userId, String action, String resource) {
        var tu = tenantUserRepository.findByTenantIdAndUserId(tenantId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado no tenant"));
        var permissions = permissionRepository.findByRoleId(tu.getRoleId());
        return permissions.stream()
            .anyMatch(p -> p.matches(action, resource));
    }

    // --- Tenant Management ---

    @Transactional(readOnly = true)
    public Tenant getTenant(String id) {
        return tenantRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Tenant não encontrado: " + id));
    }

    public Tenant activateTenant(String id) {
        var tenant = getTenant(id);
        tenant.setActive(true);
        return tenantRepository.save(tenant);
    }

    public Tenant deactivateTenant(String id) {
        var tenant = getTenant(id);
        tenant.setActive(false);
        return tenantRepository.save(tenant);
    }

    @Transactional(readOnly = true)
    public List<Tenant> listTenants() {
        return tenantRepository.findAll();
    }

    // --- Validation ---

    @Transactional(readOnly = true)
    public boolean validateTenantAccess(String tenantId, String userId) {
        return tenantUserRepository.findByTenantIdAndUserId(tenantId, userId).isPresent();
    }
}
