package plugin

import "context"

// PolicyDecision is the outcome of policy evaluation.
type PolicyDecision struct {
	Allowed    bool              `json:"allowed"`
	Message    string            `json:"message,omitempty"`
	Violations []PolicyViolation `json:"violations,omitempty"`
}

// PolicyViolation describes a policy violation.
type PolicyViolation struct {
	Rule     string `json:"rule"`
	Severity string `json:"severity"` // critical, high, medium, low
	Message  string `json:"message"`
	Resource string `json:"resource,omitempty"`
}

// Policy is the interface for OPA/custom policy evaluation.
type Policy interface {
	Plugin

	// Evaluate evaluates the policy against deployment data.
	Evaluate(ctx context.Context, data map[string]interface{}) (*PolicyDecision, error)

	// ValidatePolicy validates the policy definition itself.
	ValidatePolicy() error
}
