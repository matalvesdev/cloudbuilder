package com.cloudbuilder.provision.application.dto;

import com.cloudbuilder.provision.domain.model.DriftReport;
import com.cloudbuilder.provision.domain.model.DriftReport.DriftDetail;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public record DriftReportResponseDTO(
    String id,
    String environmentId,
    String detectedAt,
    String status,
    List<DriftItemDTO> drifts,
    String summary
) {
    public static DriftReportResponseDTO from(DriftReport report, ObjectMapper mapper) {
        List<DriftItemDTO> items = new ArrayList<>();
        try {
            List<DriftDetail> details = mapper.readValue(
                report.getDriftDetails(),
                mapper.getTypeFactory().constructCollectionType(List.class, DriftDetail.class)
            );

            // Group by resourceAddress to create one DriftItemDTO per resource
            Map<String, List<DriftDetail>> grouped = new LinkedHashMap<>();
            for (DriftDetail d : details) {
                grouped.computeIfAbsent(d.resourceAddress(), k -> new ArrayList<>()).add(d);
            }

            for (Map.Entry<String, List<DriftDetail>> entry : grouped.entrySet()) {
                String address = entry.getKey();
                List<DriftDetail> resourceDrifts = entry.getValue();

                // Determine most severe drift type for the resource
                String driftType = determineDriftType(resourceDrifts);
                String severity = determineSeverity(driftType);

                // Use first detail's values
                DriftDetail first = resourceDrifts.getFirst();
                String resourceName = extractResourceName(address);
                String resourceType = extractResourceType(address);

                items.add(new DriftItemDTO(
                    address,
                    resourceName,
                    resourceType,
                    driftType,
                    first.expectedValue(),
                    first.actualValue(),
                    severity
                ));
            }
        } catch (Exception ignored) {
            // driftDetails is null or unparseable — return empty list
        }

        int add = 0, change = 0, destroy = 0;
        for (DriftItemDTO d : items) {
            switch (d.driftType()) {
                case "ADDED" -> add++;
                case "MODIFIED" -> change++;
                case "REMOVED" -> destroy++;
            }
        }

        String summary = String.format("Adicionados: %d | Modificados: %d | Removidos: %d", add, change, destroy);
        Instant detected = report.getDetectedAt();

        return new DriftReportResponseDTO(
            report.getId(),
            report.getEnvironmentId(),
            detected != null ? detected.toString() : null,
            report.getStatus(),
            items,
            summary
        );
    }

    private static String determineDriftType(List<DriftDetail> drifts) {
        boolean hasModified = false;
        boolean hasRemoved = false;
        boolean hasAdded = false;
        for (DriftDetail d : drifts) {
            switch (d.changeType()) {
                case DriftDetail.CHANGE_ADDED -> hasAdded = true;
                case DriftDetail.CHANGE_REMOVED -> hasRemoved = true;
                case DriftDetail.CHANGE_MODIFIED -> hasModified = true;
            }
        }
        // Priority: REMOVED > MODIFIED > ADDED
        if (hasRemoved) return "REMOVED";
        if (hasModified) return "MODIFIED";
        if (hasAdded) return "ADDED";
        return "MODIFIED";
    }

    private static String determineSeverity(String driftType) {
        return switch (driftType) {
            case "REMOVED" -> "HIGH";
            case "MODIFIED" -> "MEDIUM";
            case "ADDED" -> "LOW";
            default -> "MEDIUM";
        };
    }

    private static String extractResourceName(String address) {
        if (address == null || address.isEmpty()) return "unknown";
        int dot = address.lastIndexOf('.');
        return dot >= 0 ? address.substring(dot + 1) : address;
    }

    private static String extractResourceType(String address) {
        if (address == null || address.isEmpty()) return "unknown";
        int dot = address.indexOf('.');
        return dot >= 0 ? address.substring(0, dot) : address;
    }
}
