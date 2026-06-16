package com.cloudbuilder.provision.infrastructure.web;

import com.cloudbuilder.provision.application.dto.*;
import com.cloudbuilder.provision.domain.service.*;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@RestController
@RequestMapping("/api/v1/import")
@PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')")
public class ImportController {

    private final TerraformImportService terraformImportService;
    private final TerraformStateImportService stateImportService;
    private final MultiFileImportService multiFileImportService;
    private final PropertyMappingService propertyMappingService;

    public ImportController(
            TerraformImportService terraformImportService,
            TerraformStateImportService stateImportService,
            MultiFileImportService multiFileImportService,
            PropertyMappingService propertyMappingService
    ) {
        this.terraformImportService = terraformImportService;
        this.stateImportService = stateImportService;
        this.multiFileImportService = multiFileImportService;
        this.propertyMappingService = propertyMappingService;
    }

    @PostMapping(value = "/terraform", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ImportTerraformResponse> importTerraform(
            @Valid @RequestBody ImportTerraformRequest request) {

        ImportTerraformResponse response = terraformImportService.parse(request.content());
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/state", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ImportStateResponse> importState(
            @Valid @RequestBody ImportStateRequest request) {

        var result = stateImportService.parse(request.content());
        ImportStateResponse response = new ImportStateResponse(
            result.resources(),
            result.connections(),
            result.warnings(),
            result.resourceCount()
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/multi", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<MultiFileImportService.MultiImportResult> importMulti(
            @Valid @RequestBody ImportMultiRequest request) {

        List<MultiFileImportService.MultiFileEntry> entries = request.files().stream()
            .map(f -> new MultiFileImportService.MultiFileEntry(f.fileName(), f.content()))
            .toList();

        var result = multiFileImportService.parseMulti(entries);
        return ResponseEntity.ok(result);
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<MultiFileImportService.MultiImportResult> importUpload(
            @RequestParam("files") List<MultipartFile> files) {

        List<MultiFileImportService.MultiFileEntry> entries = new ArrayList<>();

        for (MultipartFile file : files) {
            String fileName = file.getOriginalFilename();
            if (fileName == null) continue;

            try {
                // Handle zip files by extracting their contents
                if (fileName.endsWith(".zip")) {
                    try (ZipInputStream zis = new ZipInputStream(file.getInputStream())) {
                        ZipEntry entry;
                        while ((entry = zis.getNextEntry()) != null) {
                            if (entry.isDirectory()) continue;
                            String entryName = entry.getName();
                            String content = new String(zis.readAllBytes(), StandardCharsets.UTF_8);
                            entries.add(new MultiFileImportService.MultiFileEntry(entryName, content));
                        }
                    }
                } else {
                    String content = new String(file.getBytes(), StandardCharsets.UTF_8);
                    entries.add(new MultiFileImportService.MultiFileEntry(fileName, content));
                }
            } catch (Exception e) {
                // Skip files that can't be read
                entries.add(new MultiFileImportService.MultiFileEntry(
                    fileName, "// Error reading file: " + e.getMessage()
                ));
            }
        }

        var result = multiFileImportService.parseMulti(entries);
        return ResponseEntity.ok(result);
    }
}
