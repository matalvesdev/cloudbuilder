package com.cloudbuilder.iam.domain.service;

import com.cloudbuilder.iam.domain.model.*;
import com.cloudbuilder.iam.domain.port.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IamServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private TenantRepository tenantRepository;
    @Mock
    private TenantUserRepository tenantUserRepository;
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private PermissionRepository permissionRepository;

    private IamService iamService;

    private String tenantId;
    private String userId;
    private String roleId;
    private Tenant tenant;
    private User user;
    private Role role;
    private TenantUser tenantUser;

    @BeforeEach
    void setUp() {
        iamService = new IamService(userRepository, tenantRepository, tenantUserRepository,
                roleRepository, permissionRepository);

        tenantId = UUID.randomUUID().toString();
        userId = UUID.randomUUID().toString();
        roleId = UUID.randomUUID().toString();

        tenant = new Tenant("Test Org", "test-org");
        tenant.setId(tenantId);
        tenant.setActive(true);

        user = new User("user@test.com", "encoded-pass", "Test User");
        userId = user.getId(); // use the auto-generated ID from constructor

        role = new Role(tenantId, "custom-role", "Custom role", false);
        role.setId(roleId);

        tenantUser = new TenantUser(tenantId, userId, roleId);
    }

    // --- User CRUD ---

    @Test
    void createUser_ShouldSaveAndReturn() {
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        var result = iamService.createUser("New User", "new@test.com", "encoded");

        assertNotNull(result);
        assertEquals("New User", result.getName());
        assertEquals("new@test.com", result.getEmail());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void getUser_WhenExists_ShouldReturn() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        var result = iamService.getUser(userId);

        assertEquals(userId, result.getId());
        assertEquals("Test User", result.getName());
    }

    @Test
    void getUser_WhenNotFound_ShouldThrow() {
        when(userRepository.findById(any())).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> iamService.getUser(UUID.randomUUID().toString()));
    }

    @Test
    void enableUser_ShouldSetEnabled() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        var result = iamService.enableUser(userId);

        assertTrue(result.isEnabled());
        verify(userRepository).save(user);
    }

    @Test
    void disableUser_ShouldSetDisabled() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        var result = iamService.disableUser(userId);

        assertFalse(result.isEnabled());
        verify(userRepository).save(user);
    }

    // --- Tenant Users ---

    @Test
    void listUsersByTenant_ShouldReturnList() {
        when(tenantUserRepository.findByTenantId(tenantId)).thenReturn(List.of(tenantUser));

        var result = iamService.listUsersByTenant(tenantId);

        assertEquals(1, result.size());
        assertEquals(userId, result.get(0).getUserId());
    }

    @Test
    void listUsersByTenant_WithNoUsers_ShouldReturnEmpty() {
        when(tenantUserRepository.findByTenantId(tenantId)).thenReturn(List.of());

        var result = iamService.listUsersByTenant(tenantId);

        assertTrue(result.isEmpty());
    }

    @Test
    void listTenantsByUser_ShouldReturnList() {
        when(tenantUserRepository.findByUserId(userId)).thenReturn(List.of(tenantUser));

        var result = iamService.listTenantsByUser(userId);

        assertEquals(1, result.size());
        assertEquals(tenantId, result.get(0).getTenantId());
    }

    @Test
    void assignRole_ShouldUpdateRoleId() {
        var newRoleId = UUID.randomUUID().toString();
        when(tenantUserRepository.findByTenantIdAndUserId(tenantId, userId))
                .thenReturn(Optional.of(tenantUser));
        when(tenantUserRepository.save(any(TenantUser.class))).thenAnswer(i -> i.getArgument(0));

        iamService.assignRole(tenantId, userId, newRoleId);

        assertEquals(newRoleId, tenantUser.getRoleId());
        verify(tenantUserRepository).save(tenantUser);
    }

    @Test
    void assignRole_WhenUserNotInTenant_ShouldThrow() {
        when(tenantUserRepository.findByTenantIdAndUserId(any(), any())).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> iamService.assignRole(tenantId, userId, UUID.randomUUID().toString()));
    }

    // --- Roles ---

    @Test
    void createRole_ShouldSave() {
        when(roleRepository.findByTenantIdAndName(tenantId, "new-role")).thenReturn(Optional.empty());
        when(roleRepository.save(any(Role.class))).thenAnswer(i -> {
            var r = i.getArgument(0, Role.class);
            r.setId(UUID.randomUUID().toString());
            return r;
        });

        var result = iamService.createRole(tenantId, "new-role", "A new custom role");

        assertNotNull(result);
        assertEquals("new-role", result.getName());
        assertFalse(result.isSystemRole());
        verify(roleRepository).save(any(Role.class));
    }

    @Test
    void createRole_WithDuplicateName_ShouldThrow() {
        when(roleRepository.findByTenantIdAndName(tenantId, "admin")).thenReturn(Optional.of(role));

        assertThrows(IllegalArgumentException.class,
                () -> iamService.createRole(tenantId, "admin", "Duplicate"));
        verify(roleRepository, never()).save(any());
    }

    @Test
    void listRolesByTenant_ShouldReturnList() {
        when(roleRepository.findByTenantId(tenantId)).thenReturn(List.of(
                new Role(tenantId, "admin", "Admin", true),
                new Role(tenantId, "viewer", "Viewer", true)
        ));

        var result = iamService.listRolesByTenant(tenantId);

        assertEquals(2, result.size());
    }

    @Test
    void getRole_WhenExists_ShouldReturn() {
        when(roleRepository.findById(roleId)).thenReturn(Optional.of(role));

        var result = iamService.getRole(roleId);

        assertEquals("custom-role", result.getName());
    }

    @Test
    void getRole_WhenNotFound_ShouldThrow() {
        when(roleRepository.findById(any())).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> iamService.getRole(UUID.randomUUID().toString()));
    }

    @Test
    void deleteRole_WithCustomRole_ShouldSucceed() {
        when(roleRepository.findById(roleId)).thenReturn(Optional.of(role));
        when(permissionRepository.findByRoleId(roleId)).thenReturn(List.of());

        iamService.deleteRole(roleId);

        verify(roleRepository).delete(role);
    }

    @Test
    void deleteRole_WithSystemRole_ShouldThrow() {
        var sysRole = new Role(tenantId, "admin", "System admin", true);
        sysRole.setId(UUID.randomUUID().toString());
        when(roleRepository.findById(sysRole.getId())).thenReturn(Optional.of(sysRole));

        assertThrows(IllegalArgumentException.class,
                () -> iamService.deleteRole(sysRole.getId()));
        verify(roleRepository, never()).delete(any());
    }

    // --- Permissions ---

    @Test
    void listPermissionsByRole_ShouldReturnList() {
        var perms = List.of(
                new Permission(roleId, "READ", "CANVAS"),
                new Permission(roleId, "CREATE", "CANVAS")
        );
        when(permissionRepository.findByRoleId(roleId)).thenReturn(perms);

        var result = iamService.listPermissionsByRole(roleId);

        assertEquals(2, result.size());
    }

    @Test
    void hasPermission_WithMatchingPermission_ShouldReturnTrue() {
        when(tenantUserRepository.findByTenantIdAndUserId(tenantId, userId))
                .thenReturn(Optional.of(tenantUser));
        when(permissionRepository.findByRoleId(roleId)).thenReturn(
                List.of(new Permission(roleId, "READ", "CANVAS"))
        );

        var result = iamService.hasPermission(tenantId, userId, "READ", "CANVAS");

        assertTrue(result);
    }

    @Test
    void hasPermission_WithoutMatchingPermission_ShouldReturnFalse() {
        when(tenantUserRepository.findByTenantIdAndUserId(tenantId, userId))
                .thenReturn(Optional.of(tenantUser));
        when(permissionRepository.findByRoleId(roleId)).thenReturn(
                List.of(new Permission(roleId, "READ", "CANVAS"))
        );

        var result = iamService.hasPermission(tenantId, userId, "DELETE", "CANVAS");

        assertFalse(result);
    }

    @Test
    void hasPermission_WhenUserNotInTenant_ShouldThrow() {
        when(tenantUserRepository.findByTenantIdAndUserId(any(), any())).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> iamService.hasPermission(tenantId, userId, "READ", "CANVAS"));
    }

    // --- Tenant Management ---

    @Test
    void getTenant_WhenExists_ShouldReturn() {
        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));

        var result = iamService.getTenant(tenantId);

        assertEquals("Test Org", result.getName());
    }

    @Test
    void getTenant_WhenNotFound_ShouldThrow() {
        when(tenantRepository.findById(any())).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> iamService.getTenant(UUID.randomUUID().toString()));
    }

    @Test
    void activateTenant_ShouldSetActive() {
        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
        when(tenantRepository.save(any(Tenant.class))).thenAnswer(i -> i.getArgument(0));

        var result = iamService.activateTenant(tenantId);

        assertTrue(result.isActive());
    }

    @Test
    void deactivateTenant_ShouldSetInactive() {
        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
        when(tenantRepository.save(any(Tenant.class))).thenAnswer(i -> i.getArgument(0));

        var result = iamService.deactivateTenant(tenantId);

        assertFalse(result.isActive());
    }

    @Test
    void listTenants_ShouldReturnAll() {
        when(tenantRepository.findAll()).thenReturn(List.of(
                new Tenant("Org1", "org1"),
                new Tenant("Org2", "org2")
        ));

        var result = iamService.listTenants();

        assertEquals(2, result.size());
    }

    // --- Validation ---

    @Test
    void validateTenantAccess_WhenUserAssigned_ShouldReturnTrue() {
        when(tenantUserRepository.findByTenantIdAndUserId(tenantId, userId))
                .thenReturn(Optional.of(tenantUser));

        assertTrue(iamService.validateTenantAccess(tenantId, userId));
    }

    @Test
    void validateTenantAccess_WhenNotAssigned_ShouldReturnFalse() {
        when(tenantUserRepository.findByTenantIdAndUserId(any(), any())).thenReturn(Optional.empty());

        assertFalse(iamService.validateTenantAccess(tenantId, userId));
    }
}
