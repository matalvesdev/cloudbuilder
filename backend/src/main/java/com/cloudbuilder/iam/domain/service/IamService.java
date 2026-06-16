package com.cloudbuilder.iam.domain.service;

import com.cloudbuilder.iam.domain.model.*;
import com.cloudbuilder.iam.domain.port.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

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
    public User getUser(UUID id) {
        return userRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado: " + id));
    }

    public User enableUser(UUID id) {
        var user = getUser(id);
        user.setEnabled(true);
        user.setUpdatedAt(Instant.now());
        return userRepository.save(user);
    }

    public User disableUser(UUID id) {
        var user = getUser(id);
        user.setEnabled(false);
        user.setUpdatedAt(Instant.now());
        return userRepository.save(user);
    }

    // --- Tenant Users ---

    @Transactional(readOnly = true)
    public List<TenantUser> listUsersByTenant(UUID tenantId) {
        return tenantUserRepository.findByTenantId(tenantId);
    }

    @Transactional(readOnly = true)
    public List<TenantUser> listTenantsByUser(UUID userId) {
        return tenantUserRepository.findByUserId(userId);
    }

    public void assignRole(UUID tenantId, UUID userId, UUID roleId) {
        var tu = tenantUserRepository.findByTenantIdAndUserId(tenantId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado no tenant"));
        tu.setRoleId(roleId);
        tenantUserRepository.save(tu);
    }

    // --- Roles ---

    public Role createRole(UUID tenantId, String name, String description) {
        var existing = roleRepository.findByTenantIdAndName(tenantId, name);
        if (existing.isPresent()) {
            throw new IllegalArgumentException("Role já existe neste tenant: " + name);
        }
        var role = new Role(tenantId, name, description, false);
        return roleRepository.save(role);
    }

    @Transactional(readOnly = true)
    public List<Role> listRolesByTenant(UUID tenantId) {
        return roleRepository.findByTenantId(tenantId);
    }

    @Transactional(readOnly = true)
    public Role getRole(UUID id) {
        return roleRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Role não encontrada: " + id));
    }

    public void deleteRole(UUID id) {
        var role = getRole(id);
        if (role.isSystemRole()) {
            throw new IllegalArgumentException("Roles de sistema não podem ser removidas.");
        }
        permissionRepository.findByRoleId(id).forEach(permissionRepository::delete);
        roleRepository.delete(role);
    }

    // --- Permissions ---

    @Transactional(readOnly = true)
    public List<Permission> listPermissionsByRole(UUID roleId) {
        return permissionRepository.findByRoleId(roleId);
    }

    @Transactional(readOnly = true)
    public boolean hasPermission(UUID tenantId, UUID userId, String action, String resource) {
        var tu = tenantUserRepository.findByTenantIdAndUserId(tenantId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado no tenant"));
        var permissions = permissionRepository.findByRoleId(tu.getRoleId());
        return permissions.stream()
            .anyMatch(p -> p.matches(action, resource));
    }

    // --- Validation ---

    @Transactional(readOnly = true)
    public boolean validateTenantAccess(UUID tenantId, UUID userId) {
        return tenantUserRepository.findByTenantIdAndUserId(tenantId, userId).isPresent();
    }
}
