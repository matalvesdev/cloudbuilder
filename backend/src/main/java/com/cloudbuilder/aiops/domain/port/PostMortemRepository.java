package com.cloudbuilder.aiops.domain.port;

import com.cloudbuilder.aiops.domain.model.PostMortem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PostMortemRepository extends JpaRepository<PostMortem, String> {
    Optional<PostMortem> findByIncidentId(String incidentId);
    List<PostMortem> findByStatus(String status);
    List<PostMortem> findBySeverity(String severity);
}
