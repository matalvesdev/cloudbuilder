package com.cloudbuilder.iam.domain.port;

import com.cloudbuilder.iam.domain.model.BillingStub;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BillingStubRepository extends JpaRepository<BillingStub, String> {
    Optional<BillingStub> findByOrganizationId(String organizationId);
}
