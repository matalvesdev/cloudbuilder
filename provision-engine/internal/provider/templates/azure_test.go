package templates

import (
	"testing"

	"github.com/cloudbuilder/provision-engine/internal/model"
)

func TestAzureGetTemplate_ExistingTypes(t *testing.T) {
	resourceTypes := []string{
		"azurerm_resource_group",
		"azurerm_virtual_network",
		"azurerm_subnet",
		"azurerm_linux_virtual_machine",
		"azurerm_postgresql_flexible_server",
		"resource_group",
		"virtual_network",
		"vnet",
		"subnet",
		"vm",
	}

	for _, rt := range resourceTypes {
		t.Run(rt, func(t *testing.T) {
			_, ok := GetTemplate(model.ProviderAZURE, rt)
			if !ok {
				t.Errorf("GetTemplate(azure, %q) = false, want true", rt)
			}
		})
	}
}

func TestAzureGetTemplate_UnknownType(t *testing.T) {
	_, ok := GetTemplate(model.ProviderAZURE, "nonexistent")
	if ok {
		t.Error("GetTemplate(azure, nonexistent) = true, want false")
	}
}

func TestAzureGetTemplate_CrossProviderRejection(t *testing.T) {
	_, ok := GetTemplate(model.ProviderAZURE, "aws_vpc")
	if ok {
		t.Error("GetTemplate(azure, aws_vpc) = true, want false")
	}
}

func TestAzureResourceGroupTemplate(t *testing.T) {
	node := model.DesignNode{
		ID:   "rg1",
		Name: "Production RG",
		Properties: map[string]interface{}{
			"name":     "prod-rg",
			"location": "Brazil South",
		},
	}

	result, err := azureResourceGroupTemplate(node)
	if err != nil {
		t.Fatalf("azureResourceGroupTemplate() error = %v", err)
	}

	if !contains(result, "azurerm_resource_group") {
		t.Error("expected azurerm_resource_group resource")
	}
	if !contains(result, "rg1") {
		t.Error("expected node ID in resource name")
	}
	if !contains(result, "prod-rg") {
		t.Error("expected resource group name")
	}
	if !contains(result, "Brazil South") {
		t.Error("expected location")
	}
}

func TestAzureResourceGroupTemplate_Defaults(t *testing.T) {
	node := model.DesignNode{
		ID:         "rg1",
		Name:       "Default RG",
		Properties: map[string]interface{}{},
	}

	result, err := azureResourceGroupTemplate(node)
	if err != nil {
		t.Fatalf("azureResourceGroupTemplate() error = %v", err)
	}

	if !contains(result, "East US") {
		t.Error("expected default location East US")
	}
	if !contains(result, "Default RG") {
		t.Error("expected Name as default name")
	}
}

func TestAzureVirtualNetworkTemplate(t *testing.T) {
	node := model.DesignNode{
		ID:   "vnet1",
		Name: "Main VNet",
		Properties: map[string]interface{}{
			"name":         "main-vnet",
			"address_space": "10.0.0.0/8",
			"location":     "East US 2",
		},
	}

	result, err := azureVirtualNetworkTemplate(node)
	if err != nil {
		t.Fatalf("azureVirtualNetworkTemplate() error = %v", err)
	}

	if !contains(result, "azurerm_virtual_network") {
		t.Error("expected azurerm_virtual_network resource")
	}
	if !contains(result, "10.0.0.0/8") {
		t.Error("expected custom address space")
	}
	if !contains(result, "azurerm_resource_group.main.name") {
		t.Error("expected default RG reference")
	}
}

func TestAzureVirtualNetworkTemplate_CustomRG(t *testing.T) {
	node := model.DesignNode{
		ID:   "vnet2",
		Name: "Custom VNet",
		Properties: map[string]interface{}{
			"resource_group_name": "custom-rg",
			"address_space":       "172.16.0.0/12",
		},
	}

	result, err := azureVirtualNetworkTemplate(node)
	if err != nil {
		t.Fatalf("azureVirtualNetworkTemplate() error = %v", err)
	}

	if !contains(result, "azurerm_resource_group.custom-rg.name") {
		t.Error("expected custom RG reference")
	}
}

func TestAzureSubnetTemplate(t *testing.T) {
	node := model.DesignNode{
		ID:   "snet1",
		Name: "App Subnet",
		Properties: map[string]interface{}{
			"name":          "app-subnet",
			"addressPrefix": "10.0.1.0/24",
		},
	}

	result, err := azureSubnetTemplate(node)
	if err != nil {
		t.Fatalf("azureSubnetTemplate() error = %v", err)
	}

	if !contains(result, "azurerm_subnet") {
		t.Error("expected azurerm_subnet resource")
	}
	if !contains(result, "10.0.1.0/24") {
		t.Error("expected address prefix")
	}
	if !contains(result, "azurerm_virtual_network.main.name") {
		t.Error("expected default VNet reference")
	}
}

func TestAzureSubnetTemplate_CustomParents(t *testing.T) {
	node := model.DesignNode{
		ID:   "snet2",
		Name: "DB Subnet",
		Properties: map[string]interface{}{
			"resourceGroupId":   "db-rg",
			"virtualNetworkId":  "db-vnet",
			"addressPrefix":     "10.0.2.0/24",
		},
	}

	result, err := azureSubnetTemplate(node)
	if err != nil {
		t.Fatalf("azureSubnetTemplate() error = %v", err)
	}

	if !contains(result, "azurerm_resource_group.db-rg.name") {
		t.Error("expected custom RG reference")
	}
	if !contains(result, "azurerm_virtual_network.db-vnet.name") {
		t.Error("expected custom VNet reference")
	}
}

func TestAzureLinuxVMTemplate(t *testing.T) {
	node := model.DesignNode{
		ID:   "vm1",
		Name: "Web Server",
		Properties: map[string]interface{}{
			"name":           "web-vm",
			"vm_size":        "Standard_D2s_v3",
			"admin_username": "admin",
			"location":       "West Europe",
		},
	}

	result, err := azureLinuxVMTemplate(node)
	if err != nil {
		t.Fatalf("azureLinuxVMTemplate() error = %v", err)
	}

	if !contains(result, "azurerm_linux_virtual_machine") {
		t.Error("expected azurerm_linux_virtual_machine resource")
	}
	if !contains(result, "Standard_D2s_v3") {
		t.Error("expected custom VM size")
	}
	if !contains(result, "azurerm_network_interface.main.id") {
		t.Error("expected default NIC reference")
	}
}

func TestAzureLinuxVMTemplate_Defaults(t *testing.T) {
	node := model.DesignNode{
		ID:         "vm2",
		Name:       "VM",
		Properties: map[string]interface{}{},
	}

	result, err := azureLinuxVMTemplate(node)
	if err != nil {
		t.Fatalf("azureLinuxVMTemplate() error = %v", err)
	}

	if !contains(result, "Standard_B1s") {
		t.Error("expected default VM size Standard_B1s")
	}
	if !contains(result, "cloudadmin") {
		t.Error("expected default admin username")
	}
}

func TestAzurePostgresTemplate(t *testing.T) {
	node := model.DesignNode{
		ID:   "pg1",
		Name: "DB Server",
		Properties: map[string]interface{}{
			"name":       "prod-db",
			"sku_name":   "GP_Standard_D2s_v3",
			"storage_mb": 65536,
		},
	}

	result, err := azurePostgresFlexibleServerTemplate(node)
	if err != nil {
		t.Fatalf("azurePostgresFlexibleServerTemplate() error = %v", err)
	}

	if !contains(result, "azurerm_postgresql_flexible_server") {
		t.Error("expected azurerm_postgresql_flexible_server resource")
	}
	if !contains(result, "GP_Standard_D2s_v3") {
		t.Error("expected custom SKU")
	}
	if !contains(result, "65536") {
		t.Error("expected custom storage size")
	}
	if !contains(result, "azurerm_resource_group.main.name") {
		t.Error("expected default RG reference")
	}
}

func TestAzurePostgresTemplate_Defaults(t *testing.T) {
	node := model.DesignNode{
		ID:         "pg2",
		Name:       "Postgres",
		Properties: map[string]interface{}{},
	}

	result, err := azurePostgresFlexibleServerTemplate(node)
	if err != nil {
		t.Fatalf("azurePostgresFlexibleServerTemplate() error = %v", err)
	}

	if !contains(result, "B_Standard_B1ms") {
		t.Error("expected default SKU")
	}
	if !contains(result, "32768") {
		t.Error("expected default storage")
	}
}

func TestAzureGetParentRG_Exists(t *testing.T) {
	node := model.DesignNode{Properties: map[string]interface{}{"resource_group_name": "custom-rg"}}
	result := getParentAzureRG(node)
	if result != "custom-rg" {
		t.Errorf("getParentAzureRG() = %q, want %q", result, "custom-rg")
	}
}

func TestAzureGetParentRG_Default(t *testing.T) {
	node := model.DesignNode{Properties: map[string]interface{}{}}
	result := getParentAzureRG(node)
	if result != "main" {
		t.Errorf("getParentAzureRG() = %q, want %q", result, "main")
	}
}

func TestAzureGetParentVNet_Exists(t *testing.T) {
	node := model.DesignNode{Properties: map[string]interface{}{"virtual_network_name": "custom-vnet"}}
	result := getParentAzureVNet(node)
	if result != "custom-vnet" {
		t.Errorf("getParentAzureVNet() = %q, want %q", result, "custom-vnet")
	}
}

func TestAzureGetParentNIC_Exists(t *testing.T) {
	node := model.DesignNode{Properties: map[string]interface{}{"network_interface_id": "custom-nic"}}
	result := getParentAzureNIC(node)
	if result != "custom-nic" {
		t.Errorf("getParentAzureNIC() = %q, want %q", result, "custom-nic")
	}
}

func TestAzureGetParentNIC_Default(t *testing.T) {
	node := model.DesignNode{Properties: map[string]interface{}{}}
	result := getParentAzureNIC(node)
	if result != "main" {
		t.Errorf("getParentAzureNIC() = %q, want %q", result, "main")
	}
}
