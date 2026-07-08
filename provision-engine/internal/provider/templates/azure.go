package templates

import (
	"fmt"
	"strings"

	"github.com/cloudbuilder/provision-engine/internal/model"
)

// ─── Azure Resource Group ──────────────────────────────────────────────────

func azureResourceGroupTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", node.Name)
	location := getStringProp(node.Properties, "location", "East US")

	return fmt.Sprintf(`resource "azurerm_resource_group" "%s" {
  name     = "%s"
  location = "%s"

  tags = {
    Name        = "%s"
    Environment = "${var.environment}"
    ManagedBy   = "CloudBuilder"
  }
}`, node.ID, name, location, name), nil
}

// ─── Azure Virtual Network ─────────────────────────────────────────────────

func azureVirtualNetworkTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", node.Name)
	addressSpace := getStringProp(node.Properties, "address_space", "10.0.0.0/16")
	location := getStringProp(node.Properties, "location", "East US")

	return fmt.Sprintf(`resource "azurerm_virtual_network" "%s" {
  name                = "%s"
  location            = "%s"
  resource_group_name = azurerm_resource_group.%s.name
  address_space       = ["%s"]

  tags = {
    Name        = "%s"
    Environment = "${var.environment}"
    ManagedBy   = "CloudBuilder"
  }
}`, node.ID, name, location, getParentAzureRG(node), addressSpace, name), nil
}

// ─── Azure Subnet ──────────────────────────────────────────────────────────

func azureSubnetTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", node.Name)
	addressPrefix := getStringProp(node.Properties, "address_prefixes", "10.0.1.0/24")

	return fmt.Sprintf(`resource "azurerm_subnet" "%s" {
  name                 = "%s"
  resource_group_name  = azurerm_resource_group.%s.name
  virtual_network_name = azurerm_virtual_network.%s.name
  address_prefixes     = ["%s"]
}`, node.ID, name, getParentAzureRG(node), getParentAzureVNet(node), addressPrefix), nil
}

// ─── Azure Linux VM ────────────────────────────────────────────────────────

func azureLinuxVMTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", node.Name)
	size := getStringProp(node.Properties, "vm_size", "Standard_B1s")
	adminUser := getStringProp(node.Properties, "admin_username", "cloudadmin")
	location := getStringProp(node.Properties, "location", "East US")
	diskType := getStringProp(node.Properties, "os_disk_type", "Standard_LRS")
	imagePublisher := getStringProp(node.Properties, "image_publisher", "Canonical")
	imageOffer := getStringProp(node.Properties, "image_offer", "0001-com-ubuntu-server-jammy")
	imageSku := getStringProp(node.Properties, "image_sku", "22_04-lts")

	return fmt.Sprintf(`resource "azurerm_linux_virtual_machine" "%s" {
  name                = "%s"
  location            = "%s"
  resource_group_name = azurerm_resource_group.%s.name
  size                = "%s"
  admin_username      = "%s"
  network_interface_ids = [azurerm_network_interface.%s.id]

  admin_ssh_key {
    username   = "%s"
    public_key = file("~/.ssh/id_rsa.pub")
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "%s"
  }

  source_image_reference {
    publisher = "%s"
    offer     = "%s"
    sku       = "%s"
    version   = "latest"
  }

  tags = {
    Name        = "%s"
    Environment = "${var.environment}"
    ManagedBy   = "CloudBuilder"
  }
}`, node.ID, name, location, getParentAzureRG(node), size, adminUser,
		getParentAzureNIC(node), adminUser, diskType,
		imagePublisher, imageOffer, imageSku, name), nil
}

// ─── Azure AKS Cluster ─────────────────────────────────────────────────────

func azureKubernetesClusterTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", node.Name)
	location := getStringProp(node.Properties, "location", "East US")
	dnsPrefix := getStringProp(node.Properties, "dns_prefix", strings.ToLower(node.Name))
	nodeCount := getIntProp(node.Properties, "default_node_pool_count", 1)
	nodeSize := getStringProp(node.Properties, "default_node_pool_size", "Standard_B2s")
	k8sVersion := getStringProp(node.Properties, "kubernetes_version", "1.28")

	return fmt.Sprintf(`resource "azurerm_kubernetes_cluster" "%s" {
  name                = "%s"
  location            = "%s"
  resource_group_name = azurerm_resource_group.%s.name
  dns_prefix          = "%s"
  kubernetes_version  = "%s"

  default_node_pool {
    name       = "default"
    node_count = %d
    vm_size    = "%s"
  }

  identity {
    type = "SystemAssigned"
  }

  tags = {
    Name        = "%s"
    Environment = "${var.environment}"
    ManagedBy   = "CloudBuilder"
  }
}`, node.ID, name, location, getParentAzureRG(node), dnsPrefix, k8sVersion,
		nodeCount, nodeSize, name), nil
}

// ─── Azure Storage Account ─────────────────────────────────────────────────

func azureStorageAccountTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", strings.ToLower(node.Name))
	location := getStringProp(node.Properties, "location", "East US")
	tier := getStringProp(node.Properties, "account_tier", "Standard")
	replication := getStringProp(node.Properties, "account_replication_type", "LRS")

	return fmt.Sprintf(`resource "azurerm_storage_account" "%s" {
  name                     = "%s"
  location                 = "%s"
  resource_group_name      = azurerm_resource_group.%s.name
  account_tier             = "%s"
  account_replication_type = "%s"

  tags = {
    Name        = "%s"
    Environment = "${var.environment}"
    ManagedBy   = "CloudBuilder"
  }
}`, node.ID, name, location, getParentAzureRG(node), tier, replication, name), nil
}

// ─── Azure App Gateway ─────────────────────────────────────────────────────

func azureApplicationGatewayTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", node.Name)
	location := getStringProp(node.Properties, "location", "East US")
	skuName := getStringProp(node.Properties, "sku_name", "Standard_v2")
	skuTier := getStringProp(node.Properties, "sku_tier", "Standard_v2")
	capacity := getIntProp(node.Properties, "capacity", 2)

	return fmt.Sprintf(`resource "azurerm_application_gateway" "%s" {
  name                = "%s"
  location            = "%s"
  resource_group_name = azurerm_resource_group.%s.name

  sku {
    name = "%s"
    tier = "%s"
  }

  capacity = %d

  tags = {
    Name        = "%s"
    Environment = "${var.environment}"
    ManagedBy   = "CloudBuilder"
  }
}`, node.ID, name, location, getParentAzureRG(node),
		skuName, skuTier, capacity, name), nil
}

// ─── Azure SQL Database ────────────────────────────────────────────────────

func azureMssqlDatabaseTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", node.Name)
	maxSizeGB := getIntProp(node.Properties, "max_size_gb", 2)
	skuName := getStringProp(node.Properties, "sku_name", "S0")

	return fmt.Sprintf(`resource "azurerm_mssql_database" "%s" {
  name      = "%s"
  server_id = azurerm_mssql_server.%s.id
  max_size_gb = %d
  sku_name  = "%s"

  tags = {
    Name        = "%s"
    Environment = "${var.environment}"
    ManagedBy   = "CloudBuilder"
  }
}`, node.ID, name, getParentAzureServer(node), maxSizeGB, skuName, name), nil
}

// ─── Azure Function App ────────────────────────────────────────────────────

func azureFunctionAppTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", node.Name)
	location := getStringProp(node.Properties, "location", "East US")
	httpsOnly := getBoolProp(node.Properties, "https_only", true)

	return fmt.Sprintf(`resource "azurerm_linux_function_app" "%s" {
  name                = "%s"
  location            = "%s"
  resource_group_name = azurerm_resource_group.%s.name
  service_plan_id     = azurerm_service_plan.%s.id
  https_only          = %v

  site_config {}

  tags = {
    Name        = "%s"
    Environment = "${var.environment}"
    ManagedBy   = "CloudBuilder"
  }
}`, node.ID, name, location, getParentAzureRG(node),
		getParentAzurePlan(node), httpsOnly, name), nil
}

// ─── Azure Network Security Group ──────────────────────────────────────────

func azureNetworkSecurityGroupTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", node.Name)
	location := getStringProp(node.Properties, "location", "East US")

	return fmt.Sprintf(`resource "azurerm_network_security_group" "%s" {
  name                = "%s"
  location            = "%s"
  resource_group_name = azurerm_resource_group.%s.name

  security_rule {
    name                       = "allow-ssh"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }

  tags = {
    Name        = "%s"
    Environment = "${var.environment}"
    ManagedBy   = "CloudBuilder"
  }
}`, node.ID, name, location, getParentAzureRG(node), name), nil
}

// ─── Azure Redis Cache ─────────────────────────────────────────────────────

func azureRedisCacheTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", node.Name)
	location := getStringProp(node.Properties, "location", "East US")
	skuName := getStringProp(node.Properties, "sku_name", "Basic")
	skuFamily := getStringProp(node.Properties, "sku_family", "C")
	capacity := getIntProp(node.Properties, "capacity", 0)

	return fmt.Sprintf(`resource "azurerm_redis_cache" "%s" {
  name                = "%s"
  location            = "%s"
  resource_group_name = azurerm_resource_group.%s.name
  capacity            = %d
  family              = "%s"
  sku_name            = "%s"

  tags = {
    Name        = "%s"
    Environment = "${var.environment}"
    ManagedBy   = "CloudBuilder"
  }
}`, node.ID, name, location, getParentAzureRG(node),
		capacity, skuFamily, skuName, name), nil
}

// ─── Template Registry ─────────────────────────────────────────────────────

func azureTemplates() map[string]ResourceTemplate {
	return map[string]ResourceTemplate{
		"azurerm_resource_group":              azureResourceGroupTemplate,
		"azurerm_virtual_network":             azureVirtualNetworkTemplate,
		"azurerm_subnet":                      azureSubnetTemplate,
		"azurerm_linux_virtual_machine":       azureLinuxVMTemplate,
		"azurerm_kubernetes_cluster":          azureKubernetesClusterTemplate,
		"azurerm_storage_account":             azureStorageAccountTemplate,
		"azurerm_application_gateway":         azureApplicationGatewayTemplate,
		"azurerm_mssql_database":              azureMssqlDatabaseTemplate,
		"azurerm_linux_function_app":          azureFunctionAppTemplate,
		"azurerm_network_security_group":      azureNetworkSecurityGroupTemplate,
		"azurerm_redis_cache":                 azureRedisCacheTemplate,
		"azurerm_postgresql_flexible_server":  azurePostgresFlexibleServerTemplate,
		// Aliases
		"resource_group":       azureResourceGroupTemplate,
		"virtual_network":      azureVirtualNetworkTemplate,
		"vnet":                 azureVirtualNetworkTemplate,
		"subnet":               azureSubnetTemplate,
		"vm":                   azureLinuxVMTemplate,
		"aks":                  azureKubernetesClusterTemplate,
		"storage":              azureStorageAccountTemplate,
		"appgw":                azureApplicationGatewayTemplate,
		"sql":                  azureMssqlDatabaseTemplate,
		"mssql":                azureMssqlDatabaseTemplate,
		"function":             azureFunctionAppTemplate,
		"nsg":                  azureNetworkSecurityGroupTemplate,
		"redis":                azureRedisCacheTemplate,
		"postgresql":           azurePostgresFlexibleServerTemplate,
		"postgresql_server":    azurePostgresFlexibleServerTemplate,
	}
}

// ─── Helpers ───────────────────────────────────────────────────────────────

func getParentAzureRG(node model.DesignNode) string {
	if v, ok := node.Properties["resource_group_name"]; ok {
		if s, ok := v.(string); ok && s != "" {
			return s
		}
	}
	if v, ok := node.Properties["resourceGroupId"]; ok {
		if s, ok := v.(string); ok && s != "" {
			return s
		}
	}
	return "main"
}

func getParentAzureVNet(node model.DesignNode) string {
	if v, ok := node.Properties["virtual_network_name"]; ok {
		if s, ok := v.(string); ok && s != "" {
			return s
		}
	}
	if v, ok := node.Properties["virtualNetworkId"]; ok {
		if s, ok := v.(string); ok && s != "" {
			return s
		}
	}
	return "main"
}

func getParentAzureNIC(node model.DesignNode) string {
	if v, ok := node.Properties["network_interface_id"]; ok {
		if s, ok := v.(string); ok && s != "" {
			return s
		}
	}
	if v, ok := node.Properties["networkInterfaceId"]; ok {
		if s, ok := v.(string); ok && s != "" {
			return s
		}
	}
	return "main"
}

func getParentAzureServer(node model.DesignNode) string {
	if v, ok := node.Properties["server_id"]; ok {
		if s, ok := v.(string); ok && s != "" {
			return s
		}
	}
	return "main"
}

func getParentAzurePlan(node model.DesignNode) string {
	if v, ok := node.Properties["service_plan_id"]; ok {
		if s, ok := v.(string); ok && s != "" {
			return s
		}
	}
	return "main"
}

func azurePostgresFlexibleServerTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", node.Name)
	sku := getStringProp(node.Properties, "sku_name", "B_Standard_B1ms")
	storageMB := getIntProp(node.Properties, "storage_mb", 32768)
	location := getStringProp(node.Properties, "location", "East US")

	return fmt.Sprintf(`resource "azurerm_postgresql_flexible_server" "%s" {
  name                = "%s"
  location            = "%s"
  resource_group_name = azurerm_resource_group.%s.name
  sku_name            = "%s"
  storage_mb          = %d
  version             = "16"

  tags = {
    Name        = "%s"
    Environment = "${var.environment}"
    ManagedBy   = "CloudBuilder"
  }
}`, node.ID, name, location, getParentAzureRG(node), sku, storageMB, name), nil
}
