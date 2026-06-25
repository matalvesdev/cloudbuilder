package com.cloudbuilder.aiops.infrastructure.web;

import com.cloudbuilder.aiops.domain.model.Incident;
import com.cloudbuilder.aiops.domain.model.PostMortem;
import com.cloudbuilder.aiops.domain.model.RemediationAction;
import com.cloudbuilder.aiops.domain.model.Runbook;
import com.cloudbuilder.aiops.domain.service.AIOpsService;
import com.cloudbuilder.aiops.domain.service.PostMortemService;
import com.cloudbuilder.aiops.domain.service.RemediationService;
import com.cloudbuilder.aiops.domain.service.RunbookService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/aiops")
@PreAuthorize("isAuthenticated()")
public class AIOpsController {

    private final AIOpsService aiOpsService;
    private final RemediationService remediationService;
    private final RunbookService runbookService;
    private final PostMortemService postMortemService;

    public AIOpsController(AIOpsService aiOpsService,
                           RemediationService remediationService,
                           RunbookService runbookService,
                           PostMortemService postMortemService) {
        this.aiOpsService = aiOpsService;
        this.remediationService = remediationService;
        this.runbookService = runbookService;
        this.postMortemService = postMortemService;
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

    // ── Remediation Action endpoints ─────────────────────────────────

    @PostMapping("/remediation")
    public ResponseEntity<RemediationAction> createRemediationAction(@RequestBody RemediationActionRequest req) {
        var action = remediationService.createAction(req.incidentId(), req.actionType(), req.description());
        return ResponseEntity.status(HttpStatus.CREATED).body(action);
    }

    @GetMapping("/remediation/{id}")
    public ResponseEntity<RemediationAction> getRemediationAction(@PathVariable String id) {
        return remediationService.getAction(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/remediation/incident/{incidentId}")
    public ResponseEntity<List<RemediationAction>> getActionsByIncident(@PathVariable String incidentId) {
        return ResponseEntity.ok(remediationService.getActionsByIncident(incidentId));
    }

    @GetMapping("/remediation/suggested")
    public ResponseEntity<List<RemediationAction>> getSuggestedActions() {
        return ResponseEntity.ok(remediationService.getSuggestedActions());
    }

    @PostMapping("/remediation/{id}/execute")
    public ResponseEntity<RemediationAction> executeAction(@PathVariable String id,
                                                            @RequestParam String executedBy) {
        return ResponseEntity.ok(remediationService.executeAction(id, executedBy));
    }

    @PostMapping("/remediation/{id}/approve")
    public ResponseEntity<RemediationAction> approveAction(@PathVariable String id) {
        return ResponseEntity.ok(remediationService.approveAction(id));
    }

    @PostMapping("/remediation/{id}/skip")
    public ResponseEntity<RemediationAction> skipAction(@PathVariable String id) {
        return ResponseEntity.ok(remediationService.skipAction(id));
    }

    @PostMapping("/remediation/suggest/{incidentId}")
    public ResponseEntity<List<RemediationAction>> suggestActions(@PathVariable String incidentId) {
        return ResponseEntity.ok(remediationService.suggestActions(incidentId));
    }

    // ── Runbook endpoints ─────────────────────────────────────────────

    @PostMapping("/runbooks")
    public ResponseEntity<Runbook> createRunbook(@RequestBody Runbook runbook) {
        return ResponseEntity.status(HttpStatus.CREATED).body(runbookService.createRunbook(runbook));
    }

    @GetMapping("/runbooks/{id}")
    public ResponseEntity<Runbook> getRunbook(@PathVariable String id) {
        return runbookService.getRunbook(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/runbooks")
    public ResponseEntity<List<Runbook>> getAllRunbooks(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search) {
        if (category != null) {
            return ResponseEntity.ok(runbookService.getRunbooksByCategory(category));
        }
        return ResponseEntity.ok(runbookService.searchRunbooks(search));
    }

    @PostMapping("/runbooks/suggest/{incidentId}")
    public ResponseEntity<List<Runbook>> suggestRunbooks(@PathVariable String incidentId) {
        return ResponseEntity.ok(runbookService.suggestRunbooks(incidentId));
    }

    @PutMapping("/runbooks/{id}")
    public ResponseEntity<Runbook> updateRunbook(@PathVariable String id, @RequestBody UpdateRunbookRequest req) {
        return ResponseEntity.ok(runbookService.updateRunbook(
                id, req.title(), req.content(), req.category(), req.tags(),
                req.severity(), req.estimatedDurationMinutes(), req.automated()));
    }

    @DeleteMapping("/runbooks/{id}")
    public ResponseEntity<Void> deleteRunbook(@PathVariable String id) {
        runbookService.deleteRunbook(id);
        return ResponseEntity.noContent().build();
    }

    // ── Post-Mortem endpoints ─────────────────────────────────────────

    @PostMapping("/post-mortems/generate/{incidentId}")
    public ResponseEntity<PostMortem> generatePostMortem(@PathVariable String incidentId,
                                                          @RequestParam String generatedBy) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(postMortemService.generatePostMortem(incidentId, generatedBy));
    }

    @GetMapping("/post-mortems/{id}")
    public ResponseEntity<PostMortem> getPostMortem(@PathVariable String id) {
        return postMortemService.getPostMortem(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/post-mortems/incident/{incidentId}")
    public ResponseEntity<PostMortem> getPostMortemByIncident(@PathVariable String incidentId) {
        return postMortemService.getPostMortemByIncident(incidentId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/post-mortems")
    public ResponseEntity<List<PostMortem>> getAllPostMortems() {
        return ResponseEntity.ok(postMortemService.getAllPostMortems());
    }

    @PutMapping("/post-mortems/{id}")
    public ResponseEntity<PostMortem> updatePostMortem(@PathVariable String id,
                                                        @RequestBody UpdatePostMortemRequest req) {
        return ResponseEntity.ok(postMortemService.updatePostMortem(
                id, req.summary(), req.rootCause(), req.impact(),
                req.timeline(), req.actionItems(), req.lessonsLearned()));
    }

    @PostMapping("/post-mortems/{id}/publish")
    public ResponseEntity<PostMortem> publishPostMortem(@PathVariable String id) {
        return ResponseEntity.ok(postMortemService.publishPostMortem(id));
    }

    @DeleteMapping("/post-mortems/{id}")
    public ResponseEntity<Void> deletePostMortem(@PathVariable String id) {
        postMortemService.deletePostMortem(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Context-aware AI query with optional extra context (metrics, design state, incidents).
     */
    @PostMapping("/query")
    public ResponseEntity<QueryResponse> query(@RequestBody QueryRequest request) {
        var answer = aiOpsService.answerQuery(
            request.question(),
            request.context(),
            request.extraContext() != null ? request.extraContext() : Map.of()
        );
        return ResponseEntity.ok(new QueryResponse(answer));
    }

    /**
     * Analyze a specific metric for anomalies using the LLM.
     */
    @PostMapping("/analyze-metric")
    public ResponseEntity<MetricAnalysisResponse> analyzeMetric(@RequestBody MetricAnalysisRequest request) {
        var analysis = aiOpsService.analyzeMetric(
            request.metricName(),
            request.recentValues(),
            request.threshold()
        );
        return ResponseEntity.ok(new MetricAnalysisResponse(
            request.metricName(), analysis
        ));
    }

    record ClassifyRequest(String classification) {}
    record RcaRequest(String suggestedRca) {}
    record QueryRequest(String question, String context, Map<String, Object> extraContext) {}
    record QueryResponse(String answer) {}
    record MetricAnalysisRequest(String metricName, List<Double> recentValues, double threshold) {}
    record MetricAnalysisResponse(String metricName, String analysis) {}

    // Remediation records
    record RemediationActionRequest(String incidentId, String actionType, String description) {}

    // Runbook records
    record UpdateRunbookRequest(String title, String content, String category, String tags,
                                 String severity, Integer estimatedDurationMinutes, Boolean automated) {}

    // Post-mortem records
    record UpdatePostMortemRequest(String summary, String rootCause, String impact,
                                    String timeline, String actionItems, String lessonsLearned) {}
}
