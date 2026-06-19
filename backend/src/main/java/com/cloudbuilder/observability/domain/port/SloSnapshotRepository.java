package com.cloudbuilder.observability.domain.port;

import com.cloudbuilder.observability.domain.model.SloSnapshotEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SloSnapshotRepository extends JpaRepository<SloSnapshotEntity, String> {
}
