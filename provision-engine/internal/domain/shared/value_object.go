package shared

// ValueObject is the base interface for immutable domain values.
// Value objects are compared by their attributes, not identity.
type ValueObject interface {
	Equals(other ValueObject) bool
	Validate() error
}

// Entity is the base interface for domain entities.
// Entities have identity and are mutable.
type Entity interface {
	GetID() string
	Equals(other Entity) bool
}
