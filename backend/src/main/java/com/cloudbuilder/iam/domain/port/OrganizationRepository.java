package com.cloudbuilder.iam.domain.port;

import com.cloudbuilder.iam.domain.model.Organization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrganizationRepository extends JpaRepository<Organization, String> {

    Optional<Organization> findBySlug(String slug);

    boolean existsBySlug(String slug);

    List<Organization> findByOwnerId(String ownerId);

    List<Organization> findByActiveTrue();
}
