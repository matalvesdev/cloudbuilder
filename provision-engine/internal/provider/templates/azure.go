package templates

import (
	"fmt"

	"github.com/cloudbuilder/provision-engine/internal/model"
)

// azureResourceGroupTemplate generates an azurerm_resource_group block.
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

// azureVirtualNetworkTemplate generates an azurerm_virtual_network block.
func azureVirtualNetworkTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", node.Name)
	addressSpace := getStringProp(node.Properties, "addressSpace", "10.0.0.0/16")
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
}`, node.ID, name, location, getAzureParentRG(node), addressSpace, name), nil
}

// azureSubnetTemplate generates an azurerm_subnet block.
func azureSubnetTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", node.Name)
	addressPrefix := getStringProp(node.Properties, "addressPrefix", "10.0.1.0/24")

	return fmt.Sprintf(`resource "azurerm_subnet" "%s" {
  name                 = "%s"
  resource_group_name  = azurerm_resource_group.%s.name
  virtual_network_name = azurerm_virtual_network.%s.name
  address_prefixes     = ["%s"]
}`, node.ID, name, getAzureParentRG(node), getAzureParentVNet(node), addressPrefix), nil
}

// azureLinuxVMTemplate generates an azurerm_linux_virtual_machine block.
func azureLinuxVMTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", node.Name)
	size := getStringProp(node.Properties, "size", "Standard_B1s")
	adminUser := getStringProp(node.Properties, "adminUsername", "cloudadmin")
	location := getStringProp(node.Properties, "location", "East US")

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
    storage_account_type = "Standard_LRS"
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts"
    version   = "latest"
  }

  tags = {
    Name        = "%s"
    Environment = "${var.environment}"
    ManagedBy   = "CloudBuilder"
  }
}`, node.ID, name, location, getAzureParentRG(node), size, adminUser, getAzureParentNIC(node), adminUser, name), nil
}

// azurePostgresTemplate generates an azurerm_postgresql_flexible_server block.
func azurePostgresTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", node.Name)
	sku := getStringProp(node.Properties, "sku", "B_Standard_B1ms")
	storageSize := getStringProp(node.Properties, "storageMb", "32768")
	location := getStringProp(node.Properties, "location", "East US")

	return fmt.Sprintf(`resource "azurerm_postgresql_flexible_server" "%s" {
  name                = "%s"
  location            = "%s"
  resource_group_name = azurerm_resource_group.%s.name
  sku_name            = "%s"
  storage_mb          = %s
  version             = "16"

  tags = {
    Name        = "%s"
    Environment = "${var.environment}"
    ManagedBy   = "CloudBuilder"
  }
}`, node.ID, name, location, getAzureParentRG(node), sku, storageSize, name), nil
}

// --- helpers ---

func getAzureParentRG(node model.DesignNode) string {
	if v, ok := node.Properties["resourceGroupId"]; ok {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return "main"
}

func getAzureParentVNet(node model.DesignNode) string {
	if v, ok := node.Properties["virtualNetworkId"]; ok {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return "main"
}

func getAzureParentNIC(node model.DesignNode) string {
	if v, ok := node.Properties["networkInterfaceId"]; ok {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return "main"
}
