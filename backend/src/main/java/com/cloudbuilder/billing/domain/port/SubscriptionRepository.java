package com.cloudbuilder.billing.domain.port;

import com.cloudbuilder.billing.domain.model.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, String> {

    Optional<Subscription> findByTenantIdAndStatus(String tenantId, Subscription.SubscriptionStatus status);

    Optional<Subscription> findByStripeSubscriptionId(String stripeSubscriptionId);
}
