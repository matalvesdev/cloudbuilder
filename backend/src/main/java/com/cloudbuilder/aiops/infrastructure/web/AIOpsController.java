package com.cloudbuilder.aiops.infrastructure.web;

import com.cloudbuilder.aiops.application.dto.CreateIncidentRequest;
import com.cloudbuilder.aiops.application.dto.DesignTemplateDTO;
import com.cloudbuilder.aiops.domain.model.Incident;
import com.cloudbuilder.aiops.domain.model.PostMortem;
import com.cloudbuilder.aiops.domain.model.RemediationAction;
import com.cloudbuilder.aiops.domain.model.Runbook;
import com.cloudbuilder.aiops.domain.service.AIOpsService;
import com.cloudbuilder.aiops.domain.service.LogAnalysisService;
import com.cloudbuilder.aiops.domain.service.MetricsAnomalyService;
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
    private final MetricsAnomalyService metricsAnomalyService;
    private final LogAnalysisService logAnalysisService;

    public AIOpsController(AIOpsService aiOpsService,
                           RemediationService remediationService,
                           RunbookService runbookService,
                           PostMortemService postMortemService,
                           MetricsAnomalyService metricsAnomalyService,
                           LogAnalysisService logAnalysisService) {
        this.aiOpsService = aiOpsService;
        this.remediationService = remediationService;
        this.runbookService = runbookService;
        this.postMortemService = postMortemService;
        this.metricsAnomalyService = metricsAnomalyService;
        this.logAnalysisService = logAnalysisService;
    }

    /**
     * Returns pre-defined design templates for AI-suggested infrastructure patterns.
     * Used by the AIOps module to generate canvas designs from natural language prompts.
     */
    @GetMapping("/templates")
    public ResponseEntity<List<DesignTemplateDTO>> getTemplates() {
        var templates = List.of(
            DesignTemplateDTO.vpcEcsRds(),
            DesignTemplateDTO.kubernetesCluster(),
            DesignTemplateDTO.serverlessApi()
        );
        return ResponseEntity.ok(templates);
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
    public ResponseEntity<Incident> createIncident(@RequestBody CreateIncidentRequest req) {
        var incident = new Incident(req.environmentId(), req.title(), req.description(), req.severity());
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

    // ── Anomaly Detection endpoints ─────────────────────────────────

    @PostMapping("/anomaly/metrics")
    public ResponseEntity<MetricsAnomalyService.MetricAnomalyResult> analyzeMetricAnomaly(
            @RequestBody MetricAnomalyRequest request) {
        var result = metricsAnomalyService.analyzeMetric(
            request.tenantId(), request.metricName(),
            request.windowMinutes() > 0 ? request.windowMinutes() : 60,
            request.threshold()
        );
        return ResponseEntity.ok(result);
    }

    @PostMapping("/anomaly/metrics/batch")
    public ResponseEntity<List<MetricsAnomalyService.MetricAnomalyResult>> analyzeMultipleMetrics(
            @RequestBody MetricBatchAnomalyRequest request) {
        var configs = request.metrics().stream()
            .map(m -> new MetricsAnomalyService.MetricConfig(m.name(), m.threshold()))
            .toList();
        var results = metricsAnomalyService.analyzeMultipleMetrics(
            request.tenantId(), configs,
            request.windowMinutes() > 0 ? request.windowMinutes() : 60
        );
        return ResponseEntity.ok(results);
    }

    @PostMapping("/anomaly/logs")
    public ResponseEntity<LogAnalysisService.LogAnalysisResult> analyzeLogAnomaly(
            @RequestBody LogAnomalyRequest request) {
        var result = logAnalysisService.analyzeLogs(
            request.tenantId(),
            request.windowMinutes() > 0 ? request.windowMinutes() : 60,
            request.maxLogs() > 0 ? request.maxLogs() : 200
        );
        return ResponseEntity.ok(result);
    }

    @PostMapping("/anomaly/logs/search")
    public ResponseEntity<LogAnalysisService.LogAnalysisResult> analyzeLogPattern(
            @RequestBody LogPatternRequest request) {
        var result = logAnalysisService.analyzeErrorPattern(
            request.tenantId(), request.query(),
            request.windowMinutes() > 0 ? request.windowMinutes() : 60,
            request.maxLogs() > 0 ? request.maxLogs() : 200
        );
        return ResponseEntity.ok(result);
    }

    // Anomaly detection records
    record MetricAnomalyRequest(String tenantId, String metricName, int windowMinutes, double threshold) {}
    record MetricConfig(String name, double threshold) {}
    record MetricBatchAnomalyRequest(String tenantId, List<MetricConfig> metrics, int windowMinutes) {}
    record LogAnomalyRequest(String tenantId, int windowMinutes, int maxLogs) {}
    record LogPatternRequest(String tenantId, String query, int windowMinutes, int maxLogs) {}

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

    // Canvas AI Chat capabilities
    record ExplainArchitectureRequest(String canvasId, String canvasName, Map<String, Object> extraContext) {}
    record OptimizeCostRequest(String canvasId, Map<String, Object> extraContext) {}
    record SecurityReviewRequest(String canvasId, Map<String, Object> extraContext) {}
    record GenerateK8sRequest(String canvasId, Map<String, Object> extraContext) {}
    record AiChatResponse(String answer, String category) {}

    /**
     * Explain architecture: AI analyzes the canvas and explains the design.
     */
    @PostMapping("/chat/explain-architecture")
    public ResponseEntity<AiChatResponse> explainArchitecture(@RequestBody ExplainArchitectureRequest request) {
        String question = "Explique a arquitetura do canvas '" + request.canvasName()
                + "'. Descreva os componentes, conexões e padrões utilizados.";
        String answer = aiOpsService.answerQuery(question, "architecture", request.extraContext());
        return ResponseEntity.ok(new AiChatResponse(answer, "architecture"));
    }

    /**
     * Optimize cost: AI analyzes the canvas for cost optimization opportunities.
     */
    @PostMapping("/chat/optimize-cost")
    public ResponseEntity<AiChatResponse> optimizeCost(@RequestBody OptimizeCostRequest request) {
        String question = "Analise o canvas e sugira otimizações de custo. Identifique recursos subutilizados, "
                + "oportunidades de reserved instances, right-sizing, e estratégias de economia.";
        String answer = aiOpsService.answerQuery(question, "cost-optimization", request.extraContext());
        return ResponseEntity.ok(new AiChatResponse(answer, "cost"));
    }

    /**
     * Security review: AI reviews the canvas for security issues.
     */
    @PostMapping("/chat/security-review")
    public ResponseEntity<AiChatResponse> securityReview(@RequestBody SecurityReviewRequest request) {
        String question = "Realize uma revisão de segurança do canvas. Verifique exposição de portas, "
                + "grupos de segurança, criptografia, credenciais e conformidade com boas práticas.";
        String answer = aiOpsService.answerQuery(question, "security-review", request.extraContext());
        return ResponseEntity.ok(new AiChatResponse(answer, "security"));
    }

    /**
     * Generate Kubernetes manifests from canvas components.
     */
    @PostMapping("/chat/generate-k8s")
    public ResponseEntity<AiChatResponse> generateK8s(@RequestBody GenerateK8sRequest request) {
        String question = "Gere manifests Kubernetes (Deployment, Service, ConfigMap, Ingress) "
                + "para os componentes do canvas. Inclua replicas, resource limits, health checks e labels.";
        String answer = aiOpsService.answerQuery(question, "k8s-generation", request.extraContext());
        return ResponseEntity.ok(new AiChatResponse(answer, "k8s"));
    }
}
