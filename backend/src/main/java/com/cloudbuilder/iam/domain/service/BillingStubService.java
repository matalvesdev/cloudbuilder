package com.cloudbuilder.iam.domain.service;

import com.cloudbuilder.iam.application.dto.BillingStubDTO;
import com.cloudbuilder.iam.domain.model.BillingPlan;
import com.cloudbuilder.iam.domain.model.BillingStub;
import com.cloudbuilder.iam.domain.port.BillingStubRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class BillingStubService {

    private final BillingStubRepository billingStubRepository;

    public BillingStubService(BillingStubRepository billingStubRepository) {
        this.billingStubRepository = billingStubRepository;
    }

    public Optional<BillingStubDTO> getByOrganization(String organizationId) {
        return billingStubRepository.findByOrganizationId(organizationId)
            .map(BillingStubDTO::fromEntity);
    }

    public BillingStubDTO createOrUpdate(String organizationId, BillingPlan plan) {
        Optional<BillingStub> existing = billingStubRepository.findByOrganizationId(organizationId);
        if (existing.isPresent()) {
            BillingStub stub = existing.get();
            stub.setPlan(plan);
            return BillingStubDTO.fromEntity(billingStubRepository.save(stub));
        }
        BillingStub stub = new BillingStub(organizationId, plan);
        return BillingStubDTO.fromEntity(billingStubRepository.save(stub));
    }

    public void deactivate(String organizationId) {
        billingStubRepository.findByOrganizationId(organizationId)
            .ifPresent(stub -> {
                stub.setActive(false);
                billingStubRepository.save(stub);
            });
    }
}
