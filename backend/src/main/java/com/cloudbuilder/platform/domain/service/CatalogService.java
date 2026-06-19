package com.cloudbuilder.platform.domain.service;

import com.cloudbuilder.platform.domain.model.CatalogItem;
import com.cloudbuilder.platform.domain.port.CatalogItemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
@Service
@Transactional
public class CatalogService {

    private final CatalogItemRepository repository;

    public CatalogService(CatalogItemRepository repository) {
        this.repository = repository;
    }

    public CatalogItem createItem(CatalogItem item) {
        return repository.save(item);
    }

    @Transactional(readOnly = true)
    public List<CatalogItem> listItems(String type) {
        if (type != null && !type.isBlank()) {
            return repository.findByType(type);
        }
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public CatalogItem getItem(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Catalog item not found: " + id));
    }

    public CatalogItem updateItem(String id, String version, String status) {
        var item = getItem(id);
        if (version != null) item.setVersion(version);
        if (status != null) item.setStatus(status);
        return repository.save(item);
    }

    public void deleteItem(String id) {
        repository.deleteById(id);
    }
}
