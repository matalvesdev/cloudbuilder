package com.cloudbuilder.tenant.domain.port;

import com.cloudbuilder.tenant.domain.model.ProjectMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
@Repository
public interface ProjectMemberRepository extends JpaRepository<ProjectMember, String> {

    List<ProjectMember> findByProjectId(String projectId);

    Optional<ProjectMember> findByProjectIdAndUserId(String projectId, String userId);

    List<ProjectMember> findByUserId(String userId);

    long countByProjectId(String projectId);

    void deleteByProjectIdAndUserId(String projectId, String userId);
}
