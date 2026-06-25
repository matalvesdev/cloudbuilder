package com.cloudbuilder.cost.domain.service;

import com.cloudbuilder.cost.domain.model.CostOptimizationSuggestion;
import com.cloudbuilder.cost.domain.port.CostOptimizationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class CostOptimizationService {

    private final CostOptimizationRepository repository;

    public CostOptimizationService(CostOptimizationRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<CostOptimizationSuggestion> getSuggestions(String environmentId) {
        return repository.findByEnvironmentId(environmentId);
    }

    @Transactional(readOnly = true)
    public List<CostOptimizationSuggestion> getPendingSuggestions(String environmentId) {
        return repository.findByEnvironmentIdAndAppliedFalse(environmentId);
    }

    public CostOptimizationSuggestion addSuggestion(CostOptimizationSuggestion suggestion) {
        return repository.save(suggestion);
    }

    public Optional<CostOptimizationSuggestion> applySuggestion(String id) {
        return repository.findById(id).map(s -> {
            s.setApplied(true);
            return repository.save(s);
        });
    }

    @Transactional(readOnly = true)
    public List<CostOptimizationSuggestion> getSuggestionsByResource(String environmentId, String resourceId) {
        return repository.findByEnvironmentIdAndResourceId(environmentId, resourceId);
    }

    @Transactional(readOnly = true)
    public double getTotalPotentialSavings(String environmentId) {
        return repository.findByEnvironmentIdAndAppliedFalse(environmentId)
                .stream()
                .mapToDouble(CostOptimizationSuggestion::getSavings)
                .sum();
    }
}
