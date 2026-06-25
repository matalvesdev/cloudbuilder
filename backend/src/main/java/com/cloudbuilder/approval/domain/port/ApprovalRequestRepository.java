package com.cloudbuilder.approval.domain.port;

import com.cloudbuilder.approval.domain.model.ApprovalRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ApprovalRequestRepository extends JpaRepository<ApprovalRequest, String> {
    List<ApprovalRequest> findByEnvironmentIdOrderByCreatedAtDesc(String environmentId);
    List<ApprovalRequest> findByTenantIdOrderByCreatedAtDesc(String tenantId);
}
