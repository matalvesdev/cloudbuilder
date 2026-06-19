package com.cloudbuilder.provision.domain.service;

import com.cloudbuilder.provision.domain.model.Environment;
import com.cloudbuilder.provision.domain.model.ManagedResource;
import com.cloudbuilder.provision.domain.port.EnvironmentRepository;
import com.cloudbuilder.provision.domain.port.ManagedResourceRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
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
class StateServiceTest {

    @Mock
    private ManagedResourceRepository managedResourceRepository;

    @Mock
    private EnvironmentRepository environmentRepository;

    private ObjectMapper objectMapper;
    private StateService service;

    private String envId;
    private Environment environment;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        service = new StateService(managedResourceRepository, environmentRepository, objectMapper);
        envId = UUID.randomUUID().toString();
        environment = new Environment("tenant1", "prod", UUID.randomUUID().toString(), 1,
                "aws", "us-east-1", "s3", "admin");
    }

    @Test
    void recordResource_ShouldSaveAndReturn() {
        when(environmentRepository.findById(envId)).thenReturn(Optional.of(environment));
        var resource = new ManagedResource(envId, "aws_vpc.main", "aws_vpc",
                "aws", "us-east-1", "{\"cidr\":\"10.0.0.0/16\"}");
        when(managedResourceRepository.save(any(ManagedResource.class))).thenReturn(resource);

        var result = service.recordResource(envId, "aws_vpc.main",
                "aws_vpc", "aws", "{\"cidr\":\"10.0.0.0/16\"}");

        assertEquals("aws_vpc.main", result.getTerraformAddress());
        assertEquals("aws_vpc", result.getResourceType());
        assertEquals("us-east-1", result.getRegion());
    }

    @Test
    void recordResource_WhenEnvironmentNotFound_ShouldThrow() {
        when(environmentRepository.findById(envId)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () ->
                service.recordResource(envId, "addr", "type", "prov", "{}"));
    }

    @Test
    void updateResourceStatus_ShouldUpdateAndReturn() {
        var resourceId = UUID.randomUUID().toString();
        var resource = new ManagedResource(envId, "aws_vpc.main", "aws_vpc",
                "aws", "us-east-1", "{}");
        when(managedResourceRepository.findById(resourceId)).thenReturn(Optional.of(resource));
        when(managedResourceRepository.save(resource)).thenAnswer(i -> i.getArgument(0));

        var result = service.updateResourceStatus(resourceId, "ACTIVE");

        assertEquals("ACTIVE", result.getStatus());
    }

    @Test
    void updateResourceStatus_WhenNotFound_ShouldThrow() {
        when(managedResourceRepository.findById(any())).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () ->
                service.updateResourceStatus(UUID.randomUUID().toString(), "ACTIVE"));
    }

    @Test
    void updateResourceState_ShouldSetStateAndActive() {
        var resourceId = UUID.randomUUID().toString();
        var resource = new ManagedResource(envId, "aws_vpc.main", "aws_vpc",
                "aws", "us-east-1", "{}");
        when(managedResourceRepository.findById(resourceId)).thenReturn(Optional.of(resource));
        when(managedResourceRepository.save(resource)).thenAnswer(i -> i.getArgument(0));

        var result = service.updateResourceState(resourceId, "{\"id\":\"vpc-123\"}");

        assertEquals("ACTIVE", result.getStatus());
        assertEquals("{\"id\":\"vpc-123\"}", result.getStateJson());
    }

    @Test
    void getResourcesByEnvironment_ShouldReturnList() {
        var resource = new ManagedResource(envId, "aws_vpc.main", "aws_vpc",
                "aws", "us-east-1", "{}");
        when(managedResourceRepository.findByEnvironmentId(envId)).thenReturn(List.of(resource));

        var result = service.getResourcesByEnvironment(envId);

        assertEquals(1, result.size());
        assertEquals("aws_vpc.main", result.get(0).getTerraformAddress());
    }

    @Test
    void getResourceByAddress_WhenFound_ShouldReturn() {
        var resource = new ManagedResource(envId, "aws_vpc.main", "aws_vpc",
                "aws", "us-east-1", "{}");
        when(managedResourceRepository.findByTerraformAddress("aws_vpc.main"))
                .thenReturn(Optional.of(resource));

        var result = service.getResourceByAddress("aws_vpc.main");

        assertEquals("aws_vpc.main", result.getTerraformAddress());
    }

    @Test
    void getResourceByAddress_WhenNotFound_ShouldThrow() {
        when(managedResourceRepository.findByTerraformAddress("unknown"))
                .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () ->
                service.getResourceByAddress("unknown"));
    }

    @Test
    void syncResourcesFromState_ShouldParseAndMerge() {
        when(environmentRepository.findById(envId)).thenReturn(Optional.of(environment));
        var stateJson = "{ \"resources\": [{ \"address\": \"aws_vpc.main\", \"type\": \"aws_vpc\", " +
                "\"provider\": \"provider[\\\"registry.terraform.io/hashicorp/aws\\\"]\", " +
                "\"instances\": [{ \"attributes\": { \"id\": \"vpc-123\", \"cidr_block\": \"10.0.0.0/16\" } }] }] }";

        when(managedResourceRepository.findByTerraformAddress("aws_vpc.main"))
                .thenReturn(Optional.empty());
        when(managedResourceRepository.save(any(ManagedResource.class)))
                .thenAnswer(i -> i.getArgument(0));

        var result = service.syncResourcesFromState(envId, stateJson);

        assertEquals(1, result.size());
        assertEquals("aws_vpc.main", result.get(0).getTerraformAddress());
        assertEquals("ACTIVE", result.get(0).getStatus());
        assertEquals("aws", result.get(0).getProvider());
    }

    @Test
    void syncResourcesFromState_WithExistingResource_ShouldUpdate() {
        when(environmentRepository.findById(envId)).thenReturn(Optional.of(environment));
        var stateJson = "{ \"resources\": [{ \"address\": \"aws_vpc.main\", \"type\": \"aws_vpc\", " +
                "\"provider\": \"provider[\\\"registry.terraform.io/hashicorp/aws\\\"]\", " +
                "\"instances\": [{ \"attributes\": { \"id\": \"vpc-123\" } }] }] }";

        var existing = new ManagedResource(envId, "aws_vpc.main", "aws_vpc",
                "aws", "us-east-1", "{\"id\":\"vpc-old\"}");

        when(managedResourceRepository.findByTerraformAddress("aws_vpc.main"))
                .thenReturn(Optional.of(existing));
        when(managedResourceRepository.save(existing)).thenAnswer(i -> i.getArgument(0));

        var result = service.syncResourcesFromState(envId, stateJson);

        assertEquals(1, result.size());
        assertTrue(result.get(0).getStateJson().contains("\"id\":\"vpc-123\"")); // updated state contains id
    }

    @Test
    void syncResourcesFromState_WithInvalidJson_ShouldThrow() {
        when(environmentRepository.findById(envId)).thenReturn(Optional.of(environment));

        assertThrows(RuntimeException.class, () ->
                service.syncResourcesFromState(envId, "invalid json"));
    }

    @Test
    void syncResourcesFromState_WhenEnvironmentNotFound_ShouldThrow() {
        when(environmentRepository.findById(envId)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () ->
                service.syncResourcesFromState(envId, "{\"resources\": []}"));
    }

    @Test
    void syncResourcesFromState_WithNoResourcesArray_ShouldReturnEmpty() {
        when(environmentRepository.findById(envId)).thenReturn(Optional.of(environment));

        var result = service.syncResourcesFromState(envId, "{\"resources\": null}");

        assertTrue(result.isEmpty());
    }
}
