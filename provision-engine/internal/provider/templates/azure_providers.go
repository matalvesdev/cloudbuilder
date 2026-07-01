package templates

// azureTemplates returns the Azure resource template map.
func azureTemplates() map[string]ResourceTemplate {
	return map[string]ResourceTemplate{
		"azurerm_resource_group":           azureResourceGroupTemplate,
		"azurerm_virtual_network":          azureVirtualNetworkTemplate,
		"azurerm_subnet":                   azureSubnetTemplate,
		"azurerm_linux_virtual_machine":    azureLinuxVMTemplate,
		"azurerm_postgresql_flexible_server": azurePostgresTemplate,
		"resource_group":                   azureResourceGroupTemplate,
		"virtual_network":                  azureVirtualNetworkTemplate,
		"vnet":                             azureVirtualNetworkTemplate,
		"subnet":                           azureSubnetTemplate,
		"vm":                               azureLinuxVMTemplate,
		"postgresql":                       azurePostgresTemplate,
		"postgresql_server":                azurePostgresTemplate,
	}
}
