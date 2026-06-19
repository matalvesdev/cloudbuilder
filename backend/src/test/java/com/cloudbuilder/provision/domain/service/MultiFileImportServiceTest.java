package com.cloudbuilder.provision.domain.service;

import com.cloudbuilder.provision.application.dto.ImportTerraformResponse;
import com.cloudbuilder.provision.application.dto.ParsedConnection;
import com.cloudbuilder.provision.application.dto.ParsedResource;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MultiFileImportServiceTest {

    @Mock
    private TerraformImportService terraformImportService;

    @Mock
    private TerraformStateImportService stateImportService;

    private MultiFileImportService service;

    @BeforeEach
    void setUp() {
        service = new MultiFileImportService(terraformImportService, stateImportService);
    }

    @Test
    void parseMulti_WithNullFiles_ShouldReturnEmpty() {
        var result = service.parseMulti(null);

        assertTrue(result.resources().isEmpty());
        assertTrue(result.warnings().contains("Nenhum arquivo fornecido"));
        assertEquals(0, result.resourceCount());
    }

    @Test
    void parseMulti_WithEmptyFiles_ShouldReturnEmpty() {
        var result = service.parseMulti(List.of());

        assertTrue(result.resources().isEmpty());
        assertTrue(result.warnings().contains("Nenhum arquivo fornecido"));
    }

    @Test
    void parseMulti_WithBlankContent_ShouldWarn() {
        var entry = new MultiFileImportService.MultiFileEntry("test.tf", "   ");
        var result = service.parseMulti(List.of(entry));

        assertTrue(result.resources().isEmpty());
        assertTrue(result.warnings().stream().anyMatch(w -> w.contains("vazio")));
    }

    @Test
    void parseMulti_WithTerraformFile_ShouldDelegateToTerraformImport() {
        var entry = new MultiFileImportService.MultiFileEntry("main.tf", "resource \"aws_vpc\" \"main\" {}");
        var parsedResource = new ParsedResource("main", "aws_vpc", "aws", "VPC",
                false, Map.of("cidr_block", "10.0.0.0/16"));
        var parseResult = new ImportTerraformResponse(
                List.of(parsedResource), List.of(), List.of(), 1);

        when(terraformImportService.parse(anyString())).thenReturn(parseResult);

        var result = service.parseMulti(List.of(entry));

        assertEquals(1, result.resources().size());
        assertEquals("aws_vpc", result.resources().get(0).resourceType());
        verify(terraformImportService).parse(anyString());
        verifyNoInteractions(stateImportService);
    }

    @Test
    void parseMulti_WithTfStateFile_ShouldDelegateToStateImport() {
        var entry = new MultiFileImportService.MultiFileEntry("state.tfstate",
                "{\"resources\": []}");
        var parsedResource = new ParsedResource("main", "aws_instance", "aws", "EC2",
                false, Map.of("ami", "ami-12345"));
        var stateResult = new TerraformStateImportService.ImportResult(
                List.of(parsedResource), List.of(), List.of(), 1);

        when(stateImportService.parse(anyString())).thenReturn(stateResult);

        var result = service.parseMulti(List.of(entry));

        assertEquals(1, result.resources().size());
        verify(stateImportService).parse(anyString());
    }

    @Test
    void parseMulti_WithJsonFileContainingResources_ShouldParseAsState() {
        var entry = new MultiFileImportService.MultiFileEntry("config.json",
                "{\"resources\": [{\"address\": \"aws_vpc.main\", \"type\": \"aws_vpc\"," +
                        "\"provider\": \"aws\", \"instances\": []}]}");
        var parsedResource = new ParsedResource("main", "aws_vpc", "aws", "VPC",
                false, Map.of());
        var stateResult = new TerraformStateImportService.ImportResult(
                List.of(parsedResource), List.of(), List.of(), 1);

        when(stateImportService.parse(anyString())).thenReturn(stateResult);

        var result = service.parseMulti(List.of(entry));

        assertEquals(1, result.resources().size());
        verify(stateImportService).parse(anyString());
    }

    @Test
    void parseMulti_WithUnsupportedExtension_ShouldWarn() {
        var entry = new MultiFileImportService.MultiFileEntry("readme.md", "# Readme");
        var result = service.parseMulti(List.of(entry));

        assertTrue(result.resources().isEmpty());
        assertTrue(result.warnings().stream().anyMatch(w -> w.contains("não suportado")));
    }

    @Test
    void parseMulti_WithMultipleFiles_ShouldMergeResources() {
        var tfEntry = new MultiFileImportService.MultiFileEntry("vpc.tf", "resource \"aws_vpc\" \"main\" {}");
        var stateEntry = new MultiFileImportService.MultiFileEntry("state.tfstate", "{\"resources\": []}");

        var vpcResource = new ParsedResource("main", "aws_vpc", "aws", "VPC",
                false, Map.of("cidr_block", "10.0.0.0/16"));
        var s3Resource = new ParsedResource("data", "aws_s3_bucket", "aws", "S3",
                false, Map.of("bucket", "my-bucket"));

        when(terraformImportService.parse("resource \"aws_vpc\" \"main\" {}"))
                .thenReturn(new ImportTerraformResponse(
                        List.of(vpcResource), List.of(), List.of(), 1));
        when(stateImportService.parse("{\"resources\": []}"))
                .thenReturn(new TerraformStateImportService.ImportResult(
                        List.of(s3Resource), List.of(), List.of(), 1));

        var result = service.parseMulti(List.of(tfEntry, stateEntry));

        assertEquals(2, result.resources().size());
        assertEquals(2, result.resourceCount());
    }

    @Test
    void parseMulti_WithCrossFileConnections_ShouldDetect() {
        var vpcEntry = new MultiFileImportService.MultiFileEntry("vpc.tf", "resource \"aws_vpc\" \"main\" {}");
        var subnetEntry = new MultiFileImportService.MultiFileEntry("subnet.tf",
                "resource \"aws_subnet\" \"main\" {}");

        var vpcResource = new ParsedResource("main", "aws_vpc", "aws", "VPC",
                false, Map.of("id", "vpc-123", "cidr_block", "10.0.0.0/16"));
        var subnetResource = new ParsedResource("main", "aws_subnet", "aws", "Subnet",
                false, Map.of("vpc_id", "vpc-123", "cidr", "10.0.1.0/24"));

        when(terraformImportService.parse("resource \"aws_vpc\" \"main\" {}"))
                .thenReturn(new ImportTerraformResponse(
                        List.of(vpcResource), List.of(), List.of(), 1));
        when(terraformImportService.parse("resource \"aws_subnet\" \"main\" {}"))
                .thenReturn(new ImportTerraformResponse(
                        List.of(subnetResource), List.of(), List.of(), 1));

        var result = service.parseMulti(List.of(vpcEntry, subnetEntry));

        // Should detect the cross-file connection via vpc_id -> id
        assertFalse(result.connections().isEmpty());
        assertTrue(result.connections().stream()
                .anyMatch(c -> c.sourceResourceName().contains("aws_subnet")
                        && c.targetResourceName().contains("aws_vpc")));
    }

    @Test
    void parseMulti_WithDuplicateResource_ShouldDeduplicate() {
        var entry1 = new MultiFileImportService.MultiFileEntry("file1.tf",
                "resource \"aws_vpc\" \"main\" {}");
        var entry2 = new MultiFileImportService.MultiFileEntry("file2.tf",
                "resource \"aws_vpc\" \"main\" {}");

        var vpcResource = new ParsedResource("main", "aws_vpc", "aws", "VPC",
                false, Map.of("cidr_block", "10.0.0.0/16"));

        when(terraformImportService.parse(anyString())).thenReturn(
                new ImportTerraformResponse(
                        List.of(vpcResource), List.of(), List.of(), 1));

        var result = service.parseMulti(List.of(entry1, entry2));

        // Same key -> last write wins, only one resource
        assertEquals(1, result.resources().size());
    }

    @Test
    void parseMulti_WithProcessingError_ShouldCollectWarning() {
        var entry = new MultiFileImportService.MultiFileEntry("bad.tf", "invalid hcl {{{");
        when(terraformImportService.parse(anyString()))
                .thenThrow(new RuntimeException("Parse error near line 1"));

        var result = service.parseMulti(List.of(entry));

        assertTrue(result.warnings().stream().anyMatch(w -> w.contains("Erro")));
    }
}
