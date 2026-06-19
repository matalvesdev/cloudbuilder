package com.cloudbuilder.provision.domain.port;

import com.cloudbuilder.provision.domain.model.FailoverGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
public interface FailoverGroupRepository extends JpaRepository<FailoverGroup, String> {
    List<FailoverGroup> findByEnvironmentId(String environmentId);
    List<FailoverGroup> findByStatus(String status);
}
