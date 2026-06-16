package model

// ProviderType represents a cloud provider supported by the engine.
type ProviderType string

const (
	ProviderAWS ProviderType = "aws"
	ProviderAZURE ProviderType = "azure"
	ProviderGCP   ProviderType = "gcp"
	ProviderK8s   ProviderType = "k8s"
)

// DesignNode represents a single resource node in a canvas design.
type DesignNode struct {
	ID         string                 `json:"id"`
	Name       string                 `json:"name"`
	Provider   ProviderType           `json:"provider"`
	Type       string                 `json:"type"`
	Properties map[string]interface{} `json:"properties"`
	PositionX  float64                `json:"positionX"`
	PositionY  float64                `json:"positionY"`
}

// Edge represents a connection between two design nodes.
type Edge struct {
	ID       string `json:"id"`
	SourceID string `json:"sourceId"`
	TargetID string `json:"targetId"`
}

// CanvasDesign represents a complete visual design with nodes and edges.
type CanvasDesign struct {
	Nodes []DesignNode `json:"nodes"`
	Edges []Edge      `json:"edges"`
}

// GetProvider returns the provider type from a string.
func GetProvider(s string) ProviderType {
	switch ProviderType(s) {
	case ProviderAWS, ProviderAZURE, ProviderGCP, ProviderK8s:
		return ProviderType(s)
	default:
		return ProviderAWS
	}
}
