package templates

import "github.com/cloudbuilder/provision-engine/internal/model"

// GetTemplate returns the appropriate template function for a given provider and resource type.
func GetTemplate(provider model.ProviderType, resourceType string) (ResourceTemplate, bool) {
	// Build the provider→template map lazily from each provider's registry.
	all := allTemplates()

	tmpl, ok := all[provider]
	if !ok {
		return nil, false
	}

	fn, found := tmpl[resourceType]
	return fn, found
}

// allTemplates aggregates resource templates from every supported provider.
func allTemplates() map[model.ProviderType]map[string]ResourceTemplate {
	return map[model.ProviderType]map[string]ResourceTemplate{
		model.ProviderAWS:   awsTemplates(),
		model.ProviderAZURE: azureTemplates(),
		model.ProviderGCP:   gcpTemplates(),
		model.ProviderK8s:   k8sTemplates(),
	}
}
