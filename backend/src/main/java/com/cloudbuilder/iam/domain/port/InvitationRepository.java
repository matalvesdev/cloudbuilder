package com.cloudbuilder.iam.domain.port;

import com.cloudbuilder.iam.domain.model.Invitation;
import com.cloudbuilder.iam.domain.model.InvitationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InvitationRepository extends JpaRepository<Invitation, String> {
    Optional<Invitation> findByToken(String token);
    List<Invitation> findByOrganizationId(String organizationId);
    List<Invitation> findByOrganizationIdAndStatus(String organizationId, InvitationStatus status);
    Optional<Invitation> findByEmailAndOrganizationIdAndStatus(String email, String organizationId, InvitationStatus status);
}
