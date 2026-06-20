package com.cloudbuilder.observe.domain.service;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * Tracks scorecard evaluation history over time for trend analysis.
 */
@Service
public class ScorecardHistoryService {

    private final ConcurrentHashMap<String, List<ScoreSnapshot>> history = new ConcurrentHashMap<>();

    /**
     * Records a new score snapshot for a canvas.
     */
    public void recordSnapshot(String canvasId, int overallScore, String level,
                               List<Map<String, Object>> criteriaDetails) {
        var snapshot = new ScoreSnapshot(
                UUID.randomUUID().toString(),
                canvasId,
                overallScore,
                level,
                criteriaDetails,
                Instant.now()
        );
        history.computeIfAbsent(canvasId, k -> Collections.synchronizedList(new ArrayList<>())).add(snapshot);
    }

    /**
     * Returns score history for a canvas, ordered by timestamp (oldest first).
     */
    public List<ScoreSnapshot> getHistory(String canvasId) {
        var snapshots = history.get(canvasId);
        if (snapshots == null) return List.of();
        return snapshots.stream()
                .sorted(Comparator.comparing(ScoreSnapshot::timestamp))
                .collect(Collectors.toList());
    }

    /**
     * Returns the score trend direction for a canvas.
     */
    public String getTrend(String canvasId) {
        var snapshots = getHistory(canvasId);
        if (snapshots.size() < 2) return "stable";
        var latest = snapshots.get(snapshots.size() - 1);
        var previous = snapshots.get(snapshots.size() - 2);
        if (latest.overallScore > previous.overallScore) return "improving";
        if (latest.overallScore < previous.overallScore) return "declining";
        return "stable";
    }

    public record ScoreSnapshot(
            String id,
            String canvasId,
            int overallScore,
            String level,
            List<Map<String, Object>> criteriaDetails,
            Instant timestamp
    ) {}
}
