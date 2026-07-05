package com.cloudbuilder.iam.domain.port;

import com.cloudbuilder.iam.domain.model.Squad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SquadRepository extends JpaRepository<Squad, String> {

    List<Squad> findByWorkspaceId(String workspaceId);

    List<Squad> findByWorkspaceIdAndNameContainingIgnoreCase(String workspaceId, String name);

    long countByWorkspaceId(String workspaceId);
}
