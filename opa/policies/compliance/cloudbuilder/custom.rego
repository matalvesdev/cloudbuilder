# Tenant-specific policy overrides
# Rename this file per tenant (e.g. custom-tenant123.rego) with specific rules
package compliance.cloudbuilder.custom

import future.keywords.if

default allow := true

# Example: override cost threshold for dev environment
allow if {
    input.environment == "dev"
    input.projectedCost / input.budgetLimit < 0.95
}
