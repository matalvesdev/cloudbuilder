package com.cloudbuilder.platform.domain.port;

import com.cloudbuilder.platform.domain.model.CatalogItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CatalogItemRepository extends JpaRepository<CatalogItem, UUID> {
    List<CatalogItem> findByType(String type);
    List<CatalogItem> findByStatus(String status);
}
