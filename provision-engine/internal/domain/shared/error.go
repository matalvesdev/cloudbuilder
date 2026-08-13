package shared

import "fmt"

// DomainError represents a domain-level error with a code and message.
type DomainError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

func (e *DomainError) Error() string {
	return fmt.Sprintf("[%s] %s", e.Code, e.Message)
}

// NewDomainError creates a new DomainError.
func NewDomainError(code, message string) *DomainError {
	return &DomainError{Code: code, Message: message}
}

// Predefined domain errors
var (
	ErrNotFound = func(resource, id string) *DomainError {
		return NewDomainError("NOT_FOUND", fmt.Sprintf("%s with id %s not found", resource, id))
	}

	ErrAlreadyExists = func(resource, id string) *DomainError {
		return NewDomainError("ALREADY_EXISTS", fmt.Sprintf("%s with id %s already exists", resource, id))
	}

	ErrInvalidState = func(resource, state string) *DomainError {
		return NewDomainError("INVALID_STATE", fmt.Sprintf("%s is in invalid state: %s", resource, state))
	}

	ErrUnauthorized = func(action string) *DomainError {
		return NewDomainError("UNAUTHORIZED", fmt.Sprintf("unauthorized to perform: %s", action))
	}

	ErrConflict = func(resource, reason string) *DomainError {
		return NewDomainError("CONFLICT", fmt.Sprintf("%s conflict: %s", resource, reason))
	}

	ErrValidation = func(field, reason string) *DomainError {
		return NewDomainError("VALIDATION", fmt.Sprintf("validation failed for %s: %s", field, reason))
	}

	ErrTimeout = func(operation string) *DomainError {
		return NewDomainError("TIMEOUT", fmt.Sprintf("operation timed out: %s", operation))
	}

	ErrProviderUnavailable = func(provider string) *DomainError {
		return NewDomainError("PROVIDER_UNAVAILABLE", fmt.Sprintf("provider %s is unavailable", provider))
	}
)
