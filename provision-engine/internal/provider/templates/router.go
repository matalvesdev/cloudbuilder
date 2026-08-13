package templates

import (
	"sync"

	"github.com/cloudbuilder/provision-engine/internal/model"
)

var (
	templateCache     map[model.ProviderType]map[string]ResourceTemplate
	templateCacheOnce sync.Once
)

// GetTemplate returns the appropriate template function for a given provider and resource type.
func GetTemplate(provider model.ProviderType, resourceType string) (ResourceTemplate, bool) {
	all := getTemplates()

	tmpl, ok := all[provider]
	if !ok {
		return nil, false
	}

	fn, found := tmpl[resourceType]
	return fn, found
}

// getTemplates returns the cached template map, building it once on first call.
func getTemplates() map[model.ProviderType]map[string]ResourceTemplate {
	templateCacheOnce.Do(func() {
		templateCache = map[model.ProviderType]map[string]ResourceTemplate{
			model.ProviderAWS:   awsTemplates(),
			model.ProviderAZURE: azureTemplates(),
			model.ProviderGCP:   gcpTemplates(),
			model.ProviderK8s:   k8sTemplates(),
		}
	})
	return templateCache
}
