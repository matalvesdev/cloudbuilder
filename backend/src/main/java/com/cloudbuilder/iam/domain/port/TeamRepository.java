package com.cloudbuilder.iam.domain.port;

import com.cloudbuilder.iam.domain.model.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TeamRepository extends JpaRepository<Team, String> {

    List<Team> findByOrganizationId(String organizationId);

    List<Team> findByOrganizationIdAndNameContainingIgnoreCase(String organizationId, String name);
}
