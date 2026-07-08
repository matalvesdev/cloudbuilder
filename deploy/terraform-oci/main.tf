# ═══════════════════════════════════════════════════════════════════════════
# CloudBuilder — Oracle Cloud Free Tier Infrastructure
# ═══════════════════════════════════════════════════════════════════════════
# Provisions: 1 ARM instance (4 OCPU, 24GB RAM), VCN, subnet, security lists
# Free tier: ALWAYS FREE (no cost)
#
# Prerequisites:
#   1. OCI CLI configured: oci setup config (or set OCI_CONFIG env)
#   2. Terraform installed: brew install terraform (or download)
#   3. SSH key pair: ssh-keygen -t ed25519 -f ~/.ssh/oci_key
#
# Usage:
#   cd deploy/terraform-oci
#   terraform init
#   terraform plan -var="compartment_ocid=YOUR_COMPARTMENT_OCID"
#   terraform apply -var="compartment_ocid=YOUR_COMPARTMENT_OCID"
# ═══════════════════════════════════════════════════════════════════════════

terraform {
  required_version = ">= 1.5"
  required_providers {
    oci = {
      source  = "oracle/oci"
      version = "~> 6.0"
    }
  }
}

# ─── Variables ──────────────────────────────────────────────────────────────

variable "compartment_ocid" {
  description = "OCID of the compartment to create resources in"
  type        = string
}

variable "region" {
  description = "OCI region"
  type        = string
  default     = "sa-saopaulo-1" # São Paulo — lowest latency for Brazil
}

variable "ssh_public_key" {
  description = "SSH public key for instance access"
  type        = string
  default     = ""
}

variable "instance_shape" {
  description = "Instance shape (VM.Standard.A1.Flex for ARM free tier)"
  type        = string
  default     = "VM.Standard.A1.Flex"
}

variable "ocpus" {
  description = "Number of OCPUs (max 4 for free tier)"
  type        = number
  default     = 4
}

variable "memory_in_gbs" {
  description = "Memory in GB (max 24 for free tier)"
  type        = number
  default     = 24
}

variable "boot_volume_size_gbs" {
  description = "Boot volume size in GB"
  type        = number
  default     = 100
}

# ─── Provider ───────────────────────────────────────────────────────────────

provider "oci" {
  region = var.region
}

# ─── Data Sources ───────────────────────────────────────────────────────────

data "oci_identity_availability_domains" "ads" {
  compartment_id = var.compartment_ocid
}

data "oci_core_images" "ubuntu" {
  compartment_id           = var.compartment_ocid
  operating_system         = "Canonical Ubuntu"
  operating_system_version = "22.04"
  shape                    = var.instance_shape
  sort_by                  = "TIMECREATED"
  sort_order               = "DESC"
}

# ─── SSH Key (auto-generate if not provided) ───────────────────────────────

resource "tls_private_key" "ssh" {
  count     = var.ssh_public_key == "" ? 1 : 0
  algorithm = "ED25519"
}

locals {
  ssh_public_key  = var.ssh_public_key != "" ? var.ssh_public_key : tls_private_key.ssh[0].public_key_openssh
  ssh_private_key = var.ssh_public_key == "" ? tls_private_key.ssh[0].private_key_openssh : ""
  image_id        = data.oci_core_images/ubuntu.images[0].id
  ad              = data.oci_identity_availability_domains.ads.availability_domains[0].name
}

# ─── VCN ────────────────────────────────────────────────────────────────────

resource "oci_core_vcn" "cloudbuilder" {
  compartment_id = var.compartment_ocid
  display_name   = "cloudbuilder-vcn"
  cidr_blocks    = ["10.0.0.0/16"]
  dns_label      = "cloudbuilder"
}

# ─── Internet Gateway ───────────────────────────────────────────────────────

resource "oci_core_internet_gateway" "cloudbuilder" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.cloudbuilder.id
  display_name   = "cloudbuilder-igw"
  enabled        = true
}

# ─── Route Table ────────────────────────────────────────────────────────────

resource "oci_core_route_table" "cloudbuilder" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.cloudbuilder.id
  display_name   = "cloudbuilder-rt"

  route_rules {
    destination       = "0.0.0.0/0"
    destination_type  = "CIDR_BLOCK"
    network_entity_id = oci_core_internet_gateway.cloudbuilder.id
  }
}

# ─── Security List (Public Subnet) ─────────────────────────────────────────

resource "oci_core_security_list" "cloudbuilder" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.cloudbuilder.id
  display_name   = "cloudbuilder-sl"

  # Ingress: SSH
  ingress_security_rules {
    protocol    = 6 # TCP
    source      = "0.0.0.0/0"
    source_type = "CIDR_BLOCK"
    tcp_options {
      min = 22
      max = 22
    }
  }

  # Ingress: HTTP
  ingress_security_rules {
    protocol    = 6 # TCP
    source      = "0.0.0.0/0"
    source_type = "CIDR_BLOCK"
    tcp_options {
      min = 80
      max = 80
    }
  }

  # Ingress: HTTPS
  ingress_security_rules {
    protocol    = 6 # TCP
    source      = "0.0.0.0/0"
    source_type = "CIDR_BLOCK"
    tcp_options {
      min = 443
      max = 443
    }
  }

  # Ingress: Frontend (for direct access during testing)
  ingress_security_rules {
    protocol    = 6 # TCP
    source      = "0.0.0.0/0"
    source_type = "CIDR_BLOCK"
    tcp_options {
      min = 3000
      max = 3000
    }
  }

  # Ingress: Collaboration WebSocket
  ingress_security_rules {
    protocol    = 6 # TCP
    source      = "0.0.0.0/0"
    source_type = "CIDR_BLOCK"
    tcp_options {
      min = 8765
      max = 8765
    }
  }

  # Egress: All
  egress_security_rules {
    protocol    = "all"
    destination = "0.0.0.0/0"
    destination_type = "CIDR_BLOCK"
  }
}

# ─── Subnet ─────────────────────────────────────────────────────────────────

resource "oci_core_subnet" "cloudbuilder" {
  compartment_id      = var.compartment_ocid
  vcn_id              = oci_core_vcn.cloudbuilder.id
  display_name        = "cloudbuilder-subnet"
  availability_domain = local.ad
  cidr_block          = "10.0.1.0/24"
  dns_label           = "subnet"
  route_table_id      = oci_core_route_table.cloudbuilder.id
  security_list_ids   = [oci_core_security_list.cloudbuilder.id]
}

# ─── Compute Instance (ARM — Always Free) ──────────────────────────────────

resource "oci_core_instance" "cloudbuilder" {
  compartment_id      = var.compartment_ocid
  availability_domain = local.ad
  display_name        = "cloudbuilder-beta"
  shape               = var.instance_shape

  shape_config {
    ocpus         = var.ocpus
    memory_in_gbs = var.memory_in_gbs
  }

  source_details {
    source_type = "image"
    source_id   = local.image_id
    boot_volume_size_in_gbs = var.boot_volume_size_gbs
  }

  create_vnic_details {
    subnet_id        = oci_core_subnet.cloudbuilder.id
    assign_public_ip = true
  }

  metadata = {
    ssh_authorized_keys = local.ssh_public_key
    user_data = base64encode(templatefile("${path.module}/cloud-init.sh", {
      ssh_public_key = local.ssh_public_key
    }))
  }

  # Prevent destroy during testing
  lifecycle {
    prevent_destroy = false
  }
}

# ─── Outputs ────────────────────────────────────────────────────────────────

output "instance_public_ip" {
  description = "Public IP of the CloudBuilder instance"
  value       = oci_core_instance.cloudbuilder.public_ip
}

output "instance_private_ip" {
  description = "Private IP of the CloudBuilder instance"
  value       = oci_core_instance.cloudbuilder.private_ip
}

output "ssh_command" {
  description = "SSH command to connect"
  value       = "ssh -i ~/.ssh/oci_key ubuntu@${oci_core_instance.cloudbuilder.public_ip}"
}

output "frontend_url" {
  description = "Frontend URL (after deploy)"
  value       = "http://${oci_core_instance.cloudbuilder.public_ip}:3000"
}

output "api_url" {
  description = "API URL (after deploy)"
  value       = "http://${oci_core_instance.cloudbuilder.public_ip}:8080/api/v1"
}

output "ssh_private_key" {
  description = "SSH private key (only if auto-generated)"
  value       = local.ssh_private_key != "" ? "Saved to ~/.ssh/oci_key via tls_private_key" : "Using provided key"
  sensitive   = true
}
