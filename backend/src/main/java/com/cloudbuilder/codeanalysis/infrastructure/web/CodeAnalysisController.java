package com.cloudbuilder.codeanalysis.infrastructure.web;

import com.cloudbuilder.codeanalysis.application.dto.CodeAnalysisRequest;
import com.cloudbuilder.codeanalysis.application.dto.CodeAnalysisResponse;
import com.cloudbuilder.codeanalysis.domain.service.CodeAnalyzerService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/code-analysis")
@PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')")
public class CodeAnalysisController {

    private final CodeAnalyzerService analyzerService;

    public CodeAnalysisController(CodeAnalyzerService analyzerService) {
        this.analyzerService = analyzerService;
    }

    @PostMapping("/analyze")
    public ResponseEntity<CodeAnalysisResponse> analyze(@RequestBody CodeAnalysisRequest request) {
        String repoUrl = request.repoUrl();
        var sourceFiles = request.files();

        if (sourceFiles == null || sourceFiles.isEmpty()) {
            return ResponseEntity.badRequest().body(null);
        }

        var response = analyzerService.analyze(repoUrl, sourceFiles);
        return ResponseEntity.ok(response);
    }
}
