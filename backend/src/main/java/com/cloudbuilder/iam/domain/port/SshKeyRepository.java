package com.cloudbuilder.iam.domain.port;

import com.cloudbuilder.iam.domain.model.SshKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SshKeyRepository extends JpaRepository<SshKey, String> {
    List<SshKey> findByUserIdOrderByCreatedAtDesc(String userId);
    List<SshKey> findByUserIdAndActiveTrue(String userId);
    long countByUserId(String userId);
}
