package com.cloudbuilder.observability.domain.port;

import com.cloudbuilder.observability.domain.model.IncidentTimelineEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository
public interface IncidentTimelineRepository extends JpaRepository<IncidentTimelineEntity, String> {

    List<IncidentTimelineEntity> findByIncidentIdOrderByCreatedAtAsc(String incidentId);
}
