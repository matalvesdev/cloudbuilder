package com.cloudbuilder.observability.domain.service;

import com.cloudbuilder.observability.application.dto.SloDTO;
import com.cloudbuilder.observability.domain.model.SloDefinitionEntity;
import com.cloudbuilder.observability.domain.model.SloSnapshotEntity;
import com.cloudbuilder.observability.domain.port.SloDefinitionRepository;
import com.cloudbuilder.observability.domain.port.SloSnapshotRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SloService {

    private final SloDefinitionRepository definitionRepository;
    private final SloSnapshotRepository snapshotRepository;
    private final MetricsService metricsService;

    public SloService(SloDefinitionRepository definitionRepository,
                      SloSnapshotRepository snapshotRepository,
                      MetricsService metricsService) {
        this.definitionRepository = definitionRepository;
        this.snapshotRepository = snapshotRepository;
        this.metricsService = metricsService;
    }

    @Scheduled(cron = "0 0 * * * *") // Every hour
    @Transactional
    public void computeAllSloSnapshots() {
        List<SloDefinitionEntity> definitions = definitionRepository.findAll();
        for (SloDefinitionEntity slo : definitions) {
            computeSnapshot(slo);
        }
    }

    private void computeSnapshot(SloDefinitionEntity slo) {
        try {
            Instant now = Instant.now();
            Instant windowStart = now.minus(Duration.ofDays(slo.getWindowDays()));

            // Get total requests and errors from metric data
            double total = metricsService.getAggregation(
                slo.getMetricName() + ".count", slo.getTenantId(), windowStart, now, "SUM");
            double errors = metricsService.getAggregation(
                slo.getMetricName() + ".error", slo.getTenantId(), windowStart, now, "SUM");

            long totalCount = (long) total;
            long errorCount = (long) errors;
            long goodCount = totalCount - errorCount;

            double sliPct = totalCount > 0 ? (double) goodCount / totalCount * 100.0 : 100.0;
            double errorBudgetPct = slo.getTargetPct() > 0
                ? Math.max(0, (sliPct / slo.getTargetPct()) * 100.0)
                : 100.0;

            SloSnapshotEntity snapshot = new SloSnapshotEntity();
            snapshot.setSloId(slo.getId());
            snapshot.setTenantId(slo.getTenantId());
            snapshot.setWindowStart(windowStart);
            snapshot.setWindowEnd(now);
            snapshot.setGoodCount(goodCount);
            snapshot.setTotalCount(totalCount);
            snapshot.setSliPct(sliPct);
            snapshot.setErrorBudgetPct(errorBudgetPct);
            snapshot.setComputedAt(now);
            snapshotRepository.save(snapshot);
        } catch (Exception e) {
            System.err.printf("SLO computation failed for %s: %s%n", slo.getName(), e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<SloDTO> getSloStatus(String tenantId) {
        List<SloDefinitionEntity> definitions = definitionRepository.findByTenantId(tenantId);

        return definitions.stream()
            .map(slo -> {
                List<SloSnapshotEntity> snapshots = snapshotRepository.findAll().stream()
                    .filter(s -> s.getSloId().equals(slo.getId()))
                    .sorted((a, b) -> b.getComputedAt().compareTo(a.getComputedAt()))
                    .collect(Collectors.toList());

                SloSnapshotEntity latest = snapshots.isEmpty() ? null : snapshots.get(0);

                double currentSli = latest != null ? latest.getSliPct() : 100.0;
                double errorBudget = latest != null ? latest.getErrorBudgetPct() : 100.0;
                String status = latest != null && latest.getSliPct() < slo.getTargetPct() ? "BREACHED" : "WITHIN";

                return new SloDTO(
                    slo.getId(), slo.getName(), slo.getSliType(),
                    slo.getTargetPct(), currentSli, errorBudget, status
                );
            })
            .collect(Collectors.toList());
    }

    @Transactional
    public SloDefinitionEntity createSlo(SloDefinitionEntity slo) {
        return definitionRepository.save(slo);
    }
}
