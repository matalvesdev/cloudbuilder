package com.cloudbuilder.aiops.domain.service;

import com.cloudbuilder.aiops.domain.model.PostMortem;
import com.cloudbuilder.aiops.domain.model.Incident;
import com.cloudbuilder.aiops.domain.port.PostMortemRepository;
import com.cloudbuilder.aiops.domain.port.IncidentRepository;
import com.cloudbuilder.aiops.domain.service.llm.LlmClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Service for generating post-mortem reports after incident resolution.
 * Uses LlmClient for AI-generated root cause analysis and timeline synthesis.
 */
@Service
@Transactional
public class PostMortemService {

    private static final Logger log = LoggerFactory.getLogger(PostMortemService.class);

    private final PostMortemRepository postMortemRepository;
    private final IncidentRepository incidentRepository;
    private final LlmClient llmClient;

    public PostMortemService(PostMortemRepository postMortemRepository,
                             IncidentRepository incidentRepository,
                             LlmClient llmClient) {
        this.postMortemRepository = postMortemRepository;
        this.incidentRepository = incidentRepository;
        this.llmClient = llmClient;
    }

    /**
     * Generate a post-mortem report for a resolved incident.
     * Uses AI to analyze the incident and produce structured sections:
     * summary, root cause, timeline, impact, and action items.
     */
    public PostMortem generatePostMortem(String incidentId, String generatedBy) {
        var incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new IllegalArgumentException("Incident not found: " + incidentId));

        // Check if post-mortem already exists for this incident
        var existing = postMortemRepository.findByIncidentId(incidentId);
        if (existing.isPresent()) {
            throw new IllegalStateException("Post-mortem already exists for incident: " + incidentId);
        }

        String title = "Post-Mortem: " + incident.getTitle();

        // Generate summary using AI
        String summary = llmClient.generateRca(
            incident.getTitle(),
            incident.getDescription(),
            incident.getSeverity(),
            Map.of("environmentId", incident.getEnvironmentId(), "status", incident.getStatus()),
            List.of()
        );

        // Generate root cause analysis using AI
        String rootCause = llmClient.chat(
            "You are a Site Reliability Engineer conducting a post-mortem analysis. "
                    + "Identify the root cause of the following incident. Be specific and technical.",
            "Incident: " + incident.getTitle() + "\nDescription: " + incident.getDescription()
                    + "\nSeverity: " + incident.getSeverity(),
            Map.of("incidentId", incidentId, "type", "root-cause")
        );

        // Generate timeline using AI
        String timeline = llmClient.chat(
            "You are a Site Reliability Engineer. Reconstruct a timeline of events for this incident. "
                    + "Include detection, investigation, mitigation, and resolution phases with approximate timestamps.",
            "Incident: " + incident.getTitle() + "\nDescription: " + incident.getDescription(),
            Map.of("incidentId", incidentId, "type", "timeline")
        );

        // Generate action items using AI
        String actionItems = llmClient.chat(
            "You are a Site Reliability Engineer. Based on this incident, suggest concrete action items "
                    + "to prevent recurrence. List each as a separate item with owner suggestion.",
            "Incident: " + incident.getTitle() + "\nRoot cause: " + rootCause,
            Map.of("incidentId", incidentId, "type", "action-items")
        );

        var postMortem = new PostMortem(incidentId, title, summary, incident.getSeverity());
        postMortem.setRootCause(rootCause);
        postMortem.setTimeline(timeline);
        postMortem.setActionItems(actionItems);
        postMortem.setGeneratedBy(generatedBy);

        log.info("Post-mortem generated for incident {} by {}", incidentId, generatedBy);
        return postMortemRepository.save(postMortem);
    }

    @Transactional(readOnly = true)
    public Optional<PostMortem> getPostMortem(String id) {
        return postMortemRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Optional<PostMortem> getPostMortemByIncident(String incidentId) {
        return postMortemRepository.findByIncidentId(incidentId);
    }

    @Transactional(readOnly = true)
    public List<PostMortem> getAllPostMortems() {
        return postMortemRepository.findAll();
    }

    public PostMortem updatePostMortem(String id, String summary, String rootCause,
                                        String impact, String timeline, String actionItems,
                                        String lessonsLearned) {
        var postMortem = postMortemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Post-mortem not found: " + id));
        if (summary != null) postMortem.setSummary(summary);
        if (rootCause != null) postMortem.setRootCause(rootCause);
        if (impact != null) postMortem.setImpact(impact);
        if (timeline != null) postMortem.setTimeline(timeline);
        if (actionItems != null) postMortem.setActionItems(actionItems);
        if (lessonsLearned != null) postMortem.setLessonsLearned(lessonsLearned);
        return postMortemRepository.save(postMortem);
    }

    public PostMortem publishPostMortem(String id) {
        var postMortem = postMortemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Post-mortem not found: " + id));
        postMortem.publish();
        return postMortemRepository.save(postMortem);
    }

    public void deletePostMortem(String id) {
        if (!postMortemRepository.existsById(id)) {
            throw new IllegalArgumentException("Post-mortem not found: " + id);
        }
        postMortemRepository.deleteById(id);
    }
}
