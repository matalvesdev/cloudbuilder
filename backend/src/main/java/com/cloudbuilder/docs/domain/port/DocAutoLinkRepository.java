package com.cloudbuilder.docs.domain.port;

import com.cloudbuilder.docs.domain.model.DocAutoLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DocAutoLinkRepository extends JpaRepository<DocAutoLink, String> {

    List<DocAutoLink> findBySourcePath(String sourcePath);

    List<DocAutoLink> findByLinkedPath(String linkedPath);

    List<DocAutoLink> findByRelationship(String relationship);

    List<DocAutoLink> findByTenantId(String tenantId);

    @Modifying
    @Query("DELETE FROM DocAutoLink d WHERE d.id = :id")
    void deleteById(@Param("id") String id);

    @Modifying
    @Query("DELETE FROM DocAutoLink d WHERE d.sourcePath = :sourcePath")
    void deleteBySourcePath(@Param("sourcePath") String sourcePath);
}
