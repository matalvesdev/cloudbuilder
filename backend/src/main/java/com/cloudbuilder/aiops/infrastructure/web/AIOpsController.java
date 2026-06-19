package com.cloudbuilder.aiops.infrastructure.web;

import com.cloudbuilder.aiops.domain.model.Incident;
import com.cloudbuilder.aiops.domain.service.AIOpsService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/aiops")
@PreAuthorize("isAuthenticated()")
public class AIOpsController {

    private final AIOpsService aiOpsService;

    public AIOpsController(AIOpsService aiOpsService) {
        this.aiOpsService = aiOpsService;
    }

    @GetMapping("/incidents/{environmentId}")
    public ResponseEntity<List<Incident>> getIncidents(@PathVariable String environmentId) {
        return ResponseEntity.ok(aiOpsService.getIncidents(environmentId));
    }

    @GetMapping("/incidents/detail/{id}")
    public ResponseEntity<Incident> getIncident(@PathVariable String id) {
        return aiOpsService.getIncident(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/incidents")
    public ResponseEntity<Incident> createIncident(@RequestBody Incident incident) {
        return ResponseEntity.status(HttpStatus.CREATED).body(aiOpsService.createIncident(incident));
    }

    @PostMapping("/incidents/{id}/classify")
    public ResponseEntity<Incident> classifyIncident(
            @PathVariable String id, @RequestBody ClassifyRequest req) {
        return ResponseEntity.ok(aiOpsService.classifyIncident(id, req.classification()));
    }

    @PostMapping("/incidents/{id}/rca")
    public ResponseEntity<Incident> suggestRca(
            @PathVariable String id, @RequestBody RcaRequest req) {
        return ResponseEntity.ok(aiOpsService.suggestRca(id, req.suggestedRca()));
    }

    @PostMapping("/incidents/{id}/resolve")
    public ResponseEntity<Incident> resolveIncident(@PathVariable String id) {
        return ResponseEntity.ok(aiOpsService.resolveIncident(id));
    }

    @PostMapping("/incidents/{id}/analyze")
    public ResponseEntity<Incident> analyzeIncident(@PathVariable String id) {
        return ResponseEntity.ok(aiOpsService.analyzeIncident(id));
    }

    @PostMapping("/query")
    public ResponseEntity<QueryResponse> query(@RequestBody QueryRequest request) {
        var answer = aiOpsService.answerQuery(request.question(), request.context());
        return ResponseEntity.ok(new QueryResponse(answer));
    }

    record ClassifyRequest(String classification) {}
    record RcaRequest(String suggestedRca) {}
    record QueryRequest(String question, String context) {}
    record QueryResponse(String answer) {}
}
