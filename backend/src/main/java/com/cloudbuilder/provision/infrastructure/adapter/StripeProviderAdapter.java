package com.cloudbuilder.provision.infrastructure.adapter;

import com.cloudbuilder.provision.domain.port.ProviderAdapter;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.Map;

@Component
public class StripeProviderAdapter implements ProviderAdapter {
    private static final Map<String, String> IDS = Map.of(
        "stripe_product", "stripe-product", "stripe_price", "stripe-price",
        "stripe_subscription", "stripe-subscription", "stripe_customer", "stripe-customer",
        "stripe_webhook", "stripe-webhook", "stripe_payment_intent", "stripe-payment"
    );
    @Override public String getProviderType() { return "stripe"; }
    @Override public String getDisplayName() { return "Stripe"; }
    @Override public List<String> getSupportedResourceTypes() { return List.copyOf(IDS.keySet()); }
    @Override public String mapToComponentId(String r) { return IDS.getOrDefault(r, r); }
    @Override public Map<String, String> getPropertySchema(String r) { return Map.of(); }
    @Override public boolean supports(String r) { return IDS.containsKey(r); }
    @Override public String getTerraformProviderSource() { return "stripe/stripe"; }
    @Override public String getTerraformVersionConstraint() { return ">= 0.10"; }
}
