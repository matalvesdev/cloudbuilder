package com.cloudbuilder.iam.domain.service;

import com.cloudbuilder.iam.domain.model.*;
import com.cloudbuilder.iam.domain.port.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration test for IamService using Testcontainers PostgreSQL.
 * Covers: user CRUD, tenant management, roles, permissions, RBAC.
 * Disabled by default — requires a running Docker daemon.
 */
@SpringBootTest
@Testcontainers
@Disabled("Requires Docker")
@ActiveProfiles("test")
class IamServiceIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("cloudbuilder-test")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
        registry.add("spring.jpa.properties.hibernate.dialect", () -> "org.hibernate.dialect.PostgreSQLDialect");
        registry.add("spring.flyway.enabled", () -> "false");
        registry.add("spring.modulith.events.jpa.schema-initialization.enabled", () -> "false");
        registry.add("cloudbuilder.security.jwt-secret", () -> "test-secret-key-for-integration-tests-at-least-32-chars!");
    }

    @Autowired
    private IamService iamService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private TenantUserRepository tenantUserRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PermissionRepository permissionRepository;

    @AfterEach
    void cleanup() {
        permissionRepository.deleteAll();
        roleRepository.deleteAll();
        tenantUserRepository.deleteAll();
        userRepository.deleteAll();
        tenantRepository.deleteAll();
    }

    @Test
    @DisplayName("Deve criar e buscar usuário")
    void testCreateAndGetUser() {
        User user = iamService.createUser("Maria Silva", "maria@test.com", "hash-abc");
        assertNotNull(user.getId());
        assertEquals("Maria Silva", user.getName());
        assertEquals("maria@test.com", user.getEmail());
        assertTrue(user.isEnabled());

        User found = iamService.getUser(user.getId());
        assertEquals(user.getId(), found.getId());
    }

    @Test
    @DisplayName("Deve habilitar e desabilitar usuário")
    void testEnableDisableUser() {
        User user = iamService.createUser("Test User", "test@test.com", "hash");
        assertTrue(user.isEnabled());

        User disabled = iamService.disableUser(user.getId());
        assertFalse(disabled.isEnabled());

        User enabled = iamService.enableUser(user.getId());
        assertTrue(enabled.isEnabled());
    }

    @Test
    @DisplayName("Deve criar tenant e listar tenants")
    void testTenantManagement() {
        Tenant tenant = new Tenant("Acme Corp", "acme");
        Tenant saved = tenantRepository.save(tenant);
        assertNotNull(saved.getId());
        assertTrue(saved.isActive());

        List<Tenant> tenants = iamService.listTenants();
        assertEquals(1, tenants.size());
        assertEquals("Acme Corp", tenants.getFirst().getName());
    }

    @Test
    @DisplayName("Deve ativar e desativar tenant")
    void testActivateDeactivateTenant() {
        Tenant tenant = tenantRepository.save(new Tenant("Test Tenant", "test-tenant"));
        assertTrue(tenant.isActive());

        Tenant deactivated = iamService.deactivateTenant(tenant.getId());
        assertFalse(deactivated.isActive());

        Tenant activated = iamService.activateTenant(tenant.getId());
        assertTrue(activated.isActive());
    }

    @Test
    @DisplayName("Deve criar role e atribuir permissões")
    void testRoleAndPermissions() {
        Tenant tenant = tenantRepository.save(new Tenant("RBAC Tenant", "rbac-tenant"));

        Role role = iamService.createRole(tenant.getId(), "ADMIN", "Administrator role");
        assertNotNull(role.getId());
        assertEquals("ADMIN", role.getName());

        Permission perm = iamService.createPermission(role.getId(), "CREATE", "CANVAS");
        assertNotNull(perm.getId());
        assertEquals("CREATE", perm.getAction());
        assertEquals("CANVAS", perm.getResource());

        List<Permission> perms = iamService.listPermissionsByRole(role.getId());
        assertEquals(1, perms.size());
    }

    @Test
    @DisplayName("Deve duplicar role com mesmo nome no mesmo tenant")
    void testDuplicateRoleThrows() {
        Tenant tenant = tenantRepository.save(new Tenant("Dup Tenant", "dup-tenant"));
        iamService.createRole(tenant.getId(), "VIEWER", "Viewer role");

        assertThrows(IllegalArgumentException.class,
                () -> iamService.createRole(tenant.getId(), "VIEWER", "Duplicate"));
    }

    @Test
    @DisplayName("Deve validar acesso ao tenant")
    void testTenantAccessValidation() {
        Tenant tenant = tenantRepository.save(new Tenant("Access Tenant", "access-tenant"));
        User user = iamService.createUser("Access User", "access@test.com", "hash");
        Role role = iamService.createRole(tenant.getId(), "MEMBER", "Member");

        // Create TenantUser entry
        TenantUser tu = new TenantUser(tenant.getId(), user.getId(), role.getId());
        tenantUserRepository.save(tu);

        assertTrue(iamService.validateTenantAccess(tenant.getId(), user.getId()));
    }

    @Test
    @DisplayName("Deve falhar ao buscar usuário inexistente")
    void testGetNonExistentUser() {
        assertThrows(IllegalArgumentException.class,
                () -> iamService.getUser("non-existent-id"));
    }
}
