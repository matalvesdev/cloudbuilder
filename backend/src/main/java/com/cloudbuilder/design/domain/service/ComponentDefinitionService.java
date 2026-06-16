package com.cloudbuilder.design.domain.service;

import com.cloudbuilder.design.domain.model.ComponentDefinition;
import com.cloudbuilder.design.domain.port.ComponentDefinitionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class ComponentDefinitionService {

    private final ComponentDefinitionRepository repository;

    public ComponentDefinitionService(ComponentDefinitionRepository repository) {
        this.repository = repository;
    }

    public ComponentDefinition createDefinition(ComponentDefinition definition) {
        return repository.save(definition);
    }

    @Transactional(readOnly = true)
    public ComponentDefinition getDefinition(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("ComponentDefinition not found: " + id));
    }

    @Transactional(readOnly = true)
    public ComponentDefinition getDefinitionByResourceType(String resourceType) {
        return repository.findByResourceType(resourceType)
                .orElseThrow(() -> new RuntimeException("ComponentDefinition not found for resourceType: " + resourceType));
    }

    @Transactional(readOnly = true)
    public List<ComponentDefinition> listDefinitions(String provider, String category) {
        if (provider != null && category != null) {
            return repository.findByProvider(provider).stream()
                    .filter(def -> category.equals(def.getCategory()))
                    .toList();
        }
        if (provider != null) {
            return repository.findByProvider(provider);
        }
        if (category != null) {
            return repository.findByCategory(category);
        }
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public List<ComponentDefinition> getAllActiveDefinitions() {
        return repository.findByIsActiveTrue();
    }

    public void deleteDefinition(UUID id) {
        ComponentDefinition definition = getDefinition(id);
        repository.delete(definition);
    }
}
