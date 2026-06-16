package com.cloudbuilder.provision.domain.service;

import com.cloudbuilder.provision.domain.model.DriftReport;
import com.cloudbuilder.provision.domain.model.DriftReport.DriftDetail;
import com.cloudbuilder.provision.domain.model.ManagedResource;
import com.cloudbuilder.provision.domain.port.DriftReportRepository;
import com.cloudbuilder.provision.domain.port.ManagedResourceRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
@Transactional
public class DriftDetectionService {

    private final ManagedResourceRepository managedResourceRepository;
    private final DriftReportRepository driftReportRepository;
    private final StateService stateService;
    private final ObjectMapper objectMapper;

    public DriftDetectionService(ManagedResourceRepository managedResourceRepository,
                                 DriftReportRepository driftReportRepository,
                                 StateService stateService,
                                 ObjectMapper objectMapper) {
        this.managedResourceRepository = managedResourceRepository;
        this.driftReportRepository = driftReportRepository;
        this.stateService = stateService;
        this.objectMapper = objectMapper;
    }

    public DriftReport detectDrift(UUID environmentId, String currentStateJson) {
        List<ManagedResource> managedResources = managedResourceRepository.findByEnvironmentId(environmentId);
        Map<String, ManagedResource> dbResourceMap = new HashMap<>();
        for (ManagedResource mr : managedResources) {
            dbResourceMap.put(mr.getTerraformAddress(), mr);
        }

        Map<String, JsonNode> stateResourceMap = new HashMap<>();
        try {
            JsonNode root = objectMapper.readTree(currentStateJson);
            JsonNode resources = root.get("resources");
            if (resources != null && resources.isArray()) {
                for (JsonNode resourceNode : resources) {
                    String address = resourceNode.get("address").asText();
                    stateResourceMap.put(address, resourceNode);
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse state JSON", e);
        }

        List<DriftDetail> driftDetails = new ArrayList<>();

        for (Map.Entry<String, ManagedResource> entry : dbResourceMap.entrySet()) {
            String address = entry.getKey();
            ManagedResource dbResource = entry.getValue();

            if (!stateResourceMap.containsKey(address)) {
                driftDetails.add(new DriftDetail(
                    address, null, null, null, DriftDetail.CHANGE_REMOVED
                ));
            }
        }

        for (Map.Entry<String, JsonNode> entry : stateResourceMap.entrySet()) {
            String address = entry.getKey();
            JsonNode stateResource = entry.getValue();
            ManagedResource dbResource = dbResourceMap.get(address);

            if (dbResource != null) {
                List<DriftDetail> propertyDrifts = compareProperties(address, dbResource.getProperties(), stateResource);
                driftDetails.addAll(propertyDrifts);
            }
        }

        String driftDetailsJson;
        try {
            driftDetailsJson = objectMapper.writeValueAsString(driftDetails);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize drift details", e);
        }

        DriftReport report = new DriftReport(environmentId, driftDetailsJson);
        return driftReportRepository.save(report);
    }

    private List<DriftDetail> compareProperties(String address, String dbPropertiesJson, JsonNode stateResource) {
        List<DriftDetail> drifts = new ArrayList<>();

        if (dbPropertiesJson == null || dbPropertiesJson.isBlank()) {
            return drifts;
        }

        try {
            JsonNode dbProperties = objectMapper.readTree(dbPropertiesJson);
            JsonNode stateAttributes = null;
            JsonNode instances = stateResource.get("instances");
            if (instances != null && instances.isArray() && instances.size() > 0) {
                stateAttributes = instances.get(0).get("attributes");
            }

            if (stateAttributes == null) {
                return drifts;
            }

            Set<String> allKeys = new LinkedHashSet<>();
            dbProperties.fieldNames().forEachRemaining(allKeys::add);
            stateAttributes.fieldNames().forEachRemaining(allKeys::add);

            for (String key : allKeys) {
                JsonNode dbValue = dbProperties.get(key);
                JsonNode stateValue = stateAttributes.get(key);

                if (dbValue == null && stateValue == null) {
                    continue;
                }

                String dbStr = dbValue != null ? dbValue.toString() : null;
                String stateStr = stateValue != null ? stateValue.toString() : null;

                if (!Objects.equals(dbStr, stateStr)) {
                    drifts.add(new DriftDetail(
                        address, key, dbStr, stateStr, DriftDetail.CHANGE_MODIFIED
                    ));
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to compare properties for " + address, e);
        }

        return drifts;
    }

    @Transactional(readOnly = true)
    public List<DriftReport> getDriftHistory(UUID environmentId) {
        return driftReportRepository.findByEnvironmentIdOrderByDetectedAtDesc(environmentId);
    }

    public DriftReport resolveDrift(UUID reportId, String resolvedBy) {
        DriftReport report = driftReportRepository.findById(reportId)
            .orElseThrow(() -> new IllegalArgumentException("Drift report not found: " + reportId));
        report.setStatus(DriftReport.STATUS_RESOLVED);
        report.setResolvedAt(Instant.now());
        report.setResolvedBy(resolvedBy);
        return driftReportRepository.save(report);
    }

    @Transactional(readOnly = true)
    public Optional<DriftReport> getLatestDrift(UUID environmentId) {
        return driftReportRepository.findTopByEnvironmentIdOrderByDetectedAtDesc(environmentId);
    }
}
