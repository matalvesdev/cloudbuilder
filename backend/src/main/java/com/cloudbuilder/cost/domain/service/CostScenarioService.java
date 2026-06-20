package com.cloudbuilder.cost.domain.service;

import com.cloudbuilder.cost.domain.model.CostScenario;
import com.cloudbuilder.cost.domain.port.CostScenarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class CostScenarioService {

    private final CostScenarioRepository repository;

    public CostScenarioService(CostScenarioRepository repository) {
        this.repository = repository;
    }

    public CostScenario create(CostScenario scenario) {
        return repository.save(scenario);
    }

    @Transactional(readOnly = true)
    public List<CostScenario> findByEnvironment(String environmentId) {
        return repository.findByEnvironmentIdOrderByCreatedAtDesc(environmentId);
    }

    @Transactional(readOnly = true)
    public List<CostScenario> findByCanvas(String canvasId) {
        return repository.findByCanvasIdOrderByCreatedAtDesc(canvasId);
    }

    @Transactional(readOnly = true)
    public List<CostScenario> findByTenant(String tenantId) {
        return repository.findByTenantIdOrderByCreatedAtDesc(tenantId);
    }

    @Transactional(readOnly = true)
    public CostScenario findById(String id) {
        return repository.findById(id).orElse(null);
    }

    public void delete(String id) {
        repository.deleteById(id);
    }
}
