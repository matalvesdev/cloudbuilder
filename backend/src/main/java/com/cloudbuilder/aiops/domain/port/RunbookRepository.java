package com.cloudbuilder.aiops.domain.port;

import com.cloudbuilder.aiops.domain.model.Runbook;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RunbookRepository extends JpaRepository<Runbook, String> {
    List<Runbook> findByCategory(String category);
    List<Runbook> findBySeverity(String severity);
    List<Runbook> findByAutomatedTrue();

    @Query("SELECT r FROM Runbook r WHERE LOWER(r.title) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(r.tags) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(r.content) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Runbook> search(@Param("query") String query);
}
