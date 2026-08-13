package com.cloudbuilder.iam.domain.service;

import com.cloudbuilder.iam.domain.model.*;
import com.cloudbuilder.iam.domain.port.*;
import com.cloudbuilder.shared.security.TenantContext;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;
@Service
@Transactional
public class IamService {

    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final TenantUserRepository tenantUserRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final PasswordEncoder passwordEncoder;

    public IamService(UserRepository userRepository,
                      TenantRepository tenantRepository,
                      TenantUserRepository tenantUserRepository,
                      RoleRepository roleRepository,
                      PermissionRepository permissionRepository,
                      PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.tenantRepository = tenantRepository;
        this.tenantUserRepository = tenantUserRepository;
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // --- Users ---

    public User createUser(String name, String email, String password) {
        var user = new User(email, passwordEncoder.encode(password), name);
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
    public List<TenantUserInfoDTO> listUsersByTenant(String tenantId) {
        requireCurrentTenant(tenantId);
        var tenantUsers = tenantUserRepository.findByTenantId(tenantId);
        return tenantUsers.stream().map(tu -> {
            var user = userRepository.findById(tu.getUserId()).orElse(null);
            var role = roleRepository.findById(tu.getRoleId()).orElse(null);
            return new TenantUserInfoDTO(
                tu.getId(),
                tu.getUserId(),
                user != null ? user.getName() : "Desconhecido",
                user != null ? user.getEmail() : "",
                user != null ? user.isEnabled() : false,
                tu.getRoleId(),
                role != null ? role.getName() : "UNKNOWN",
                tu.getStatus().name(),
                tu.getJoinedAt()
            );
        }).toList();
    }

    public record TenantUserInfoDTO(
        String id, String userId, String name, String email, boolean enabled,
        String roleId, String roleName, String status, java.time.LocalDateTime joinedAt
    ) {}

    @Transactional(readOnly = true)
    public List<UserTenantInfoDTO> listTenantsByUser(String userId) {
        var tenantUsers = tenantUserRepository.findByUserId(userId);
        return tenantUsers.stream().map(tu -> {
            var tenant = tenantRepository.findById(tu.getTenantId()).orElse(null);
            var role = roleRepository.findById(tu.getRoleId()).orElse(null);
            return new UserTenantInfoDTO(
                tu.getTenantId(),
                tenant != null ? tenant.getName() : "Desconhecido",
                tenant != null ? tenant.getSlug() : "",
                tenant != null ? tenant.isActive() : false,
                tu.getRoleId(),
                role != null ? role.getName() : "UNKNOWN",
                tu.getStatus().name(),
                tu.getJoinedAt()
            );
        }).toList();
    }

    public record UserTenantInfoDTO(
        String tenantId, String tenantName, String tenantSlug, boolean tenantActive,
        String roleId, String roleName, String status, java.time.LocalDateTime joinedAt
    ) {}

    public TenantUser createUserInTenant(String tenantId, String name, String email, String password, String roleId) {
        requireCurrentTenant(tenantId);
        // Validate tenant exists
        getTenant(tenantId);

        // Validate role exists and belongs to this tenant
        var role = getRole(roleId);
        if (!role.getTenantId().equals(tenantId)) {
            throw new IllegalArgumentException("Role não pertence a este tenant");
        }

        // Check if user already exists by email
        var existingUser = userRepository.findByEmail(email);
        String userId;
        if (existingUser.isPresent()) {
            userId = existingUser.get().getId();
            // Check if already in this tenant
            if (tenantUserRepository.findByTenantIdAndUserId(tenantId, userId).isPresent()) {
                throw new IllegalArgumentException("Usuário já está neste tenant: " + email);
            }
        } else {
            // Create new user
            var user = createUser(name, email, password);
            userId = user.getId();
        }

        // Link user to tenant
        var tenantUser = new TenantUser(tenantId, userId, roleId);
        return tenantUserRepository.save(tenantUser);
    }

    public void removeUserFromTenant(String tenantId, String userId) {
        requireCurrentTenant(tenantId);
        var tu = tenantUserRepository.findByTenantIdAndUserId(tenantId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado neste tenant"));
        tenantUserRepository.delete(tu);
    }

    public void assignRole(String tenantId, String userId, String roleId) {
        requireCurrentTenant(tenantId);
        var role = getRole(roleId);
        if (!tenantId.equals(role.getTenantId())) {
            throw new AccessDeniedException("A role não pertence ao tenant ativo");
        }
        var tu = tenantUserRepository.findByTenantIdAndUserId(tenantId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado no tenant"));
        tu.setRoleId(roleId);
        tenantUserRepository.save(tu);
    }

    // --- Roles ---

    public Role createRole(String tenantId, String name, String description) {
        requireCurrentTenant(tenantId);
        var existing = roleRepository.findByTenantIdAndName(tenantId, name);
        if (existing.isPresent()) {
            throw new IllegalArgumentException("Role já existe neste tenant: " + name);
        }
        var role = new Role(tenantId, name, description, false);
        return roleRepository.save(role);
    }

    @Transactional(readOnly = true)
    public List<Role> listRolesByTenant(String tenantId) {
        requireCurrentTenant(tenantId);
        return roleRepository.findByTenantId(tenantId);
    }

    @Transactional(readOnly = true)
    public Role getRole(String id) {
        var role = roleRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Role não encontrada: " + id));
        requireCurrentTenant(role.getTenantId());
        return role;
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
        var permission = permissionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Permissão não encontrada: " + id));
        getRole(permission.getRoleId());
        permissionRepository.delete(permission);
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

    @Transactional(readOnly = true)
    public List<Tenant> listTenantsForUser(String userId) {
        return tenantUserRepository.findByUserId(userId).stream()
                .map(TenantUser::getTenantId)
                .distinct()
                .map(tenantRepository::findById)
                .flatMap(Optional::stream)
                .toList();
    }

    public Tenant createTenant(String name, String slug) {
        var existing = tenantRepository.findBySlug(slug);
        if (existing.isPresent()) {
            throw new IllegalArgumentException("Tenant com slug já existe: " + slug);
        }
        var tenant = new Tenant(name, slug);
        var saved = tenantRepository.save(tenant);

        // Create default roles for the new tenant
        roleRepository.save(new Role(saved.getId(), "ADMIN", "Administrador do tenant", true));
        roleRepository.save(new Role(saved.getId(), "EDITOR", "Editor com acesso de escrita", true));
        roleRepository.save(new Role(saved.getId(), "VIEWER", "Somente leitura", true));

        return saved;
    }

    // --- Validation ---

    @Transactional(readOnly = true)
    public boolean validateTenantAccess(String tenantId, String userId) {
        return tenantUserRepository.findByTenantIdAndUserId(tenantId, userId).isPresent();
    }

    // --- User Permissions Summary ---

    @Transactional(readOnly = true)
    public List<UserPermissionsDTO> getUserPermissions(String userId) {
        var tenantUsers = tenantUserRepository.findByUserId(userId);
        return tenantUsers.stream().map(tu -> {
            var role = roleRepository.findById(tu.getRoleId()).orElse(null);
            var roleName = role != null ? role.getName() : "UNKNOWN";
            var permissions = permissionRepository.findByRoleId(tu.getRoleId());
            var permissionSet = permissions.stream()
                .map(p -> p.getAction() + ":" + p.getResource())
                .collect(Collectors.toSet());
            return new UserPermissionsDTO(tu.getTenantId(), tu.getRoleId(), roleName, permissionSet);
        }).toList();
    }

    public record UserPermissionsDTO(String tenantId, String roleId, String roleName, Set<String> permissions) {}

    private static void requireCurrentTenant(String requestedTenantId) {
        String currentTenantId = TenantContext.getTenantId();
        if (currentTenantId != null && !currentTenantId.equals(requestedTenantId)) {
            throw new AccessDeniedException("O recurso não pertence ao tenant ativo");
        }
    }
}
