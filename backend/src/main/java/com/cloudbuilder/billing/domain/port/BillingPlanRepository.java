package com.cloudbuilder.billing.domain.port;

import com.cloudbuilder.billing.domain.model.BillingPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BillingPlanRepository extends JpaRepository<BillingPlan, String> {

    Optional<BillingPlan> findByCode(String code);

    List<BillingPlan> findByActiveTrueOrderBySortOrder();
}
