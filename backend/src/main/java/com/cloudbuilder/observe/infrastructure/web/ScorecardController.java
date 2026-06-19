package com.cloudbuilder.observe.infrastructure.web;

import com.cloudbuilder.design.domain.model.Canvas;
import com.cloudbuilder.design.domain.model.CanvasNode;
import com.cloudbuilder.design.domain.port.CanvasRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * Scorecards — Avalia a maturidade da arquitetura de um canvas
 * com critérios automáticos (HA, segurança, custo, escalabilidade, observabilidade).
 */
@RestController
@RequestMapping("/api/v1/scorecards")
public class ScorecardController {

    private final CanvasRepository canvasRepository;

    public ScorecardController(CanvasRepository canvasRepository) {
        this.canvasRepository = canvasRepository;
    }

    @GetMapping("/{canvasId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ScorecardResponse> getScorecard(@PathVariable String canvasId) {
        var canvas = canvasRepository.findById(canvasId)
                .orElseThrow(() -> new IllegalArgumentException("Canvas not found: " + canvasId));

        var nodes = canvas.getCanvasNodes();
        var scores = evaluateAll(nodes);
        var overall = (int) Math.round(scores.stream().mapToInt(ScoreItem::score).average().orElse(0));
        var level = levelFromScore(overall);

        return ResponseEntity.ok(new ScorecardResponse(
                canvas.getId(), canvas.getName(), overall, level, scores));
    }

    /* ─── Evaluation Criteria ─────────────────────────────────────── */

    private List<ScoreItem> evaluateAll(List<CanvasNode> nodes) {
        return List.of(
                evaluateHighAvailability(nodes),
                evaluateSecurity(nodes),
                evaluateCostOptimization(nodes),
                evaluateScalability(nodes),
                evaluateObservability(nodes),
                evaluateDocumentation(nodes)
        );
    }

    private ScoreItem evaluateHighAvailability(List<CanvasNode> nodes) {
        var hasMultiAz = nodes.stream().anyMatch(n -> hasProperty(n, "multi_az", "true"));
        var hasLoadBalancer = nodes.stream().anyMatch(n -> {
            var rt = getResourceType(n);
            return rt != null && (rt.contains("alb") || rt.contains("elb") || rt.contains("load_balancer"));
        });
        var hasReplica = nodes.stream().anyMatch(n -> hasProperty(n, "replicas", "2") || hasProperty(n, "replicas", "3"));

        var score = 0;
        if (hasMultiAz) score += 40;
        if (hasLoadBalancer) score += 30;
        if (hasReplica) score += 30;

        var suggestions = new ArrayList<String>();
        if (!hasMultiAz) suggestions.add("Ative Multi-AZ para banco de dados — garante failover automático entre zonas");
        if (!hasLoadBalancer) suggestions.add("Adicione um load balancer — distribui tráfego entre instâncias");
        if (!hasReplica) suggestions.add("Configure réplicas (>1) para serviços críticos — evita single point of failure");

        return new ScoreItem("Alta Disponibilidade", score, 100, suggestions);
    }

    private ScoreItem evaluateSecurity(List<CanvasNode> nodes) {
        var hasEncryption = nodes.stream().anyMatch(n -> hasProperty(n, "encryption", "true"));
        var hasVpc = nodes.stream().anyMatch(n -> {
            var rt = getResourceType(n);
            return rt != null && (rt.contains("vpc") || rt.contains("security_group"));
        });
        var hasWaf = nodes.stream().anyMatch(n -> {
            var rt = getResourceType(n);
            return rt != null && rt.contains("waf");
        });

        var score = 0;
        if (hasEncryption) score += 40;
        if (hasVpc) score += 35;
        if (hasWaf) score += 25;

        var suggestions = new ArrayList<String>();
        if (!hasEncryption) suggestions.add("Ative criptografia em repouso para dados sensíveis");
        if (!hasVpc) suggestions.add("Configure VPC e security groups — isole recursos em rede privada");
        if (!hasWaf) suggestions.add("Adicione WAF — protege contra ataques web comuns (SQLi, XSS)");

        return new ScoreItem("Segurança", score, 100, suggestions);
    }

    private ScoreItem evaluateCostOptimization(List<CanvasNode> nodes) {
        var hasRightSizing = nodes.stream().anyMatch(n -> hasProperty(n, "instance_type", "t3"));
        var hasAutoScaling = nodes.stream().anyMatch(n -> hasProperty(n, "auto_scaling", "true"));
        var hasSpot = nodes.stream().anyMatch(n -> hasProperty(n, "spot", "true"));

        var score = 0;
        if (hasRightSizing) score += 30;
        if (hasAutoScaling) score += 40;
        if (hasSpot) score += 30;

        var suggestions = new ArrayList<String>();
        if (!hasRightSizing) suggestions.add("Use instâncias da série T (burstable) para workloads não intensivos");
        if (!hasAutoScaling) suggestions.add("Configure Auto Scaling — ajusta capacidade conforme demanda");
        if (!hasSpot) suggestions.add("Considere instâncias Spot para workloads tolerantes a falhas (até 70% de desconto)");

        return new ScoreItem("Otimização de Custos", score, 100, suggestions);
    }

    private ScoreItem evaluateScalability(List<CanvasNode> nodes) {
        var hasAutoScaling = nodes.stream().anyMatch(n -> hasProperty(n, "auto_scaling", "true"));
        var hasCache = nodes.stream().anyMatch(n -> {
            var rt = getResourceType(n);
            return rt != null && (rt.contains("cache") || rt.contains("redis") || rt.contains("elasticache"));
        });
        var hasCdn = nodes.stream().anyMatch(n -> {
            var rt = getResourceType(n);
            return rt != null && (rt.contains("cdn") || rt.contains("cloudfront"));
        });

        var score = 0;
        if (hasAutoScaling) score += 40;
        if (hasCache) score += 35;
        if (hasCdn) score += 25;

        var suggestions = new ArrayList<String>();
        if (!hasAutoScaling) suggestions.add("Configure Auto Scaling para acomodar picos de tráfego");
        if (!hasCache) suggestions.add("Adicione cache (Redis/ElastiCache) para reduzir latência em consultas frequentes");
        if (!hasCdn) suggestions.add("Implemente CDN para distribuir conteúdo estático globalmente");

        return new ScoreItem("Escalabilidade", score, 100, suggestions);
    }

    private ScoreItem evaluateObservability(List<CanvasNode> nodes) {
        var hasMonitoring = nodes.stream().anyMatch(n -> {
            var rt = getResourceType(n);
            return rt != null && (rt.contains("cloudwatch") || rt.contains("monitoring"));
        });
        var hasLogging = nodes.stream().anyMatch(n -> hasProperty(n, "logging", "true") || hasProperty(n, "log_retention", "true"));
        var hasAlerts = nodes.stream().anyMatch(n -> hasProperty(n, "alarm", "true") || hasProperty(n, "alert", "true"));

        var score = 0;
        if (hasMonitoring) score += 40;
        if (hasLogging) score += 30;
        if (hasAlerts) score += 30;

        var suggestions = new ArrayList<String>();
        if (!hasMonitoring) suggestions.add("Configure métricas e dashboard de monitoramento");
        if (!hasLogging) suggestions.add("Ative logging centralizado com retenção adequada");
        if (!hasAlerts) suggestions.add("Crie alarmes para notificação proativa de incidentes");

        return new ScoreItem("Observabilidade", score, 100, suggestions);
    }

    private ScoreItem evaluateDocumentation(List<CanvasNode> nodes) {
        var hasTags = nodes.stream().anyMatch(n -> hasProperty(n, "tags", null) || hasProperty(n, "Name", null));
        var hasName = nodes.stream().anyMatch(n -> {
            var props = n.getProperties();
            return props != null && (props.contains("Name") || props.contains("description"));
        });

        var score = 0;
        if (hasTags) score += 50;
        if (hasName) score += 50;

        var suggestions = new ArrayList<String>();
        if (!hasTags) suggestions.add("Adicione tags aos recursos — facilita identificação e alocação de custos");
        if (!hasName) suggestions.add("Nomeie todos os recursos descritivamente para melhor documentação");

        return new ScoreItem("Documentação", score, 100, suggestions);
    }

    /* ─── Helpers ──────────────────────────────────────────────────── */

    private boolean hasProperty(CanvasNode node, String key, String expectedValue) {
        var props = node.getProperties();
        if (props == null || props.isBlank()) return false;
        try {
            @SuppressWarnings("unchecked")
            var map = new com.fasterxml.jackson.databind.ObjectMapper()
                    .readValue(props, java.util.Map.class);
            var val = map.get(key);
            if (val == null) return false;
            if (expectedValue == null) return true;
            return val.toString().equalsIgnoreCase(expectedValue);
        } catch (Exception e) {
            return props.contains(key) && (expectedValue == null || props.contains(expectedValue));
        }
    }

    private String getResourceType(CanvasNode node) {
        return node.getComponentDefinitionId();
    }

    private String levelFromScore(int score) {
        if (score >= 90) return "platinum";
        if (score >= 75) return "gold";
        if (score >= 55) return "silver";
        if (score >= 35) return "bronze";
        return "initial";
    }

    /* ─── DTOs ─────────────────────────────────────────────────────── */

    public record ScorecardResponse(
            String canvasId, String canvasName, int overallScore,
            String level, List<ScoreItem> scores) {}

    public record ScoreItem(
            String criterion, int score, int maxScore, List<String> suggestions) {}
}
