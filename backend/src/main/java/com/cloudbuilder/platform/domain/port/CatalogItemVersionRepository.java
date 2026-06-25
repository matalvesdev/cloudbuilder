package com.cloudbuilder.platform.domain.port;

import com.cloudbuilder.platform.domain.model.CatalogItemVersion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CatalogItemVersionRepository extends JpaRepository<CatalogItemVersion, String> {
    List<CatalogItemVersion> findByCatalogItemIdOrderByCreatedAtDesc(String catalogItemId);
}
