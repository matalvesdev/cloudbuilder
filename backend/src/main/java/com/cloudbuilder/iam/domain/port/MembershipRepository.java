package com.cloudbuilder.iam.domain.port;

import com.cloudbuilder.iam.domain.model.Membership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MembershipRepository extends JpaRepository<Membership, String> {

    List<Membership> findByOrganizationId(String organizationId);

    List<Membership> findByUserId(String userId);

    Optional<Membership> findByOrganizationIdAndUserId(String organizationId, String userId);

    List<Membership> findByTeamId(String teamId);

    boolean existsByOrganizationIdAndUserId(String organizationId, String userId);

    long countByOrganizationId(String organizationId);
}
