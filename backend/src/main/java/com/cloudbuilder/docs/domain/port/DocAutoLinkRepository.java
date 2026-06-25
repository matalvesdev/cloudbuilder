package com.cloudbuilder.docs.domain.port;

import com.cloudbuilder.docs.domain.model.DocAutoLink;
import java.util.List;
import java.util.Optional;

public interface DocAutoLinkRepository {
    DocAutoLink save(DocAutoLink link);
    Optional<DocAutoLink> findById(String id);
    List<DocAutoLink> findBySourcePath(String sourcePath);
    List<DocAutoLink> findByLinkedPath(String linkedPath);
    List<DocAutoLink> findByRelationship(String relationship);
    List<DocAutoLink> findByTenantId(String tenantId);
    List<DocAutoLink> findAll();
    void delete(String id);
    void deleteBySourcePath(String sourcePath);
}
