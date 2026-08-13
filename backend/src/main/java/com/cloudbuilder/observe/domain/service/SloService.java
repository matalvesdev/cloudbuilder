package com.cloudbuilder.observe.domain.service;

import com.cloudbuilder.observe.domain.model.SliSnapshot;
import com.cloudbuilder.observe.domain.model.SloDefinition;
import com.cloudbuilder.observe.domain.port.SliSnapshotRepository;
import com.cloudbuilder.observe.domain.port.SloDefinitionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Transactional
public class SloService {

    private final SloDefinitionRepository sloDefinitionRepository;
    private final SliSnapshotRepository sliSnapshotRepository;

    public SloService(SloDefinitionRepository sloDefinitionRepository,
                      SliSnapshotRepository sliSnapshotRepository) {
        this.sloDefinitionRepository = sloDefinitionRepository;
        this.sliSnapshotRepository = sliSnapshotRepository;
    }

    /* ─── SLO Definitions ─────────────────────────────────────────── */

    public SloDefinition createSlo(SloDefinition definition) {
        return sloDefinitionRepository.save(definition);
    }

    @Transactional(readOnly = true)
    public List<SloDefinition> getSloDefinitions(String environmentId) {
        return sloDefinitionRepository.findByEnvironmentId(environmentId);
    }

    @Transactional(readOnly = true)
    public Optional<SloDefinition> getSloById(String id) {
        return sloDefinitionRepository.findById(id);
    }

    public void deleteSlo(String id) {
        sloDefinitionRepository.deleteById(id);
    }

    /* ─── SLI Snapshots ───────────────────────────────────────────── */

    public SliSnapshot recordSli(SliSnapshot snapshot) {
        return sliSnapshotRepository.save(snapshot);
    }

    @Transactional(readOnly = true)
    public List<SliSnapshot> getSliHistory(String sloId) {
        return sliSnapshotRepository.findBySloDefinitionIdOrderByMeasuredAtDesc(sloId);
    }

    @Transactional(readOnly = true)
    public List<SliSnapshot> getSliHistoryInRange(String sloId, Instant start, Instant end) {
        return sliSnapshotRepository.findBySloDefinitionIdAndMeasuredAtBetweenOrderByMeasuredAtAsc(
                sloId, start, end);
    }

    /* ─── Compliance Summary ──────────────────────────────────────── */

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getComplianceSummary(String environmentId) {
        var definitions = sloDefinitionRepository.findByEnvironmentId(environmentId);
        return definitions.stream().map(def -> {
            var snapshots = sliSnapshotRepository
                    .findBySloDefinitionIdOrderByMeasuredAtDesc(def.getId());
            double compliancePct = 0;
            int totalSnapshots = snapshots.size();
            long compliantCount = snapshots.stream().filter(SliSnapshot::isCompliant).count();
            if (totalSnapshots > 0) {
                compliancePct = (compliantCount * 100.0) / totalSnapshots;
            }
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("id", def.getId());
            entry.put("name", def.getName());
            entry.put("serviceName", def.getServiceName());
            entry.put("sliType", def.getSliType());
            entry.put("targetValue", def.getTargetValue());
            entry.put("targetUnit", def.getTargetUnit());
            entry.put("compliancePct", Math.round(compliancePct * 100.0) / 100.0);
            entry.put("totalSnapshots", totalSnapshots);
            entry.put("status", def.getStatus());
            return entry;
        }).toList();
    }
}
