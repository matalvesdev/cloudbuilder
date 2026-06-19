package com.cloudbuilder.platform.domain.port;

import com.cloudbuilder.platform.domain.model.CatalogItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
public interface CatalogItemRepository extends JpaRepository<CatalogItem, String> {
    List<CatalogItem> findByType(String type);
    List<CatalogItem> findByStatus(String status);
}
