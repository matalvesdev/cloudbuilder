package com.cloudbuilder.tenant.domain.port;

import com.cloudbuilder.tenant.domain.model.ProjectMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectMemberRepository extends JpaRepository<ProjectMember, UUID> {

    List<ProjectMember> findByProjectId(UUID projectId);

    Optional<ProjectMember> findByProjectIdAndUserId(UUID projectId, String userId);

    List<ProjectMember> findByUserId(String userId);

    long countByProjectId(UUID projectId);

    void deleteByProjectIdAndUserId(UUID projectId, String userId);
}
