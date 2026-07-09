# CloudBuilder — Oracle Cloud Free Tier (uses existing VCN)

variable "tenancy_ocid" {
  type = string
}

variable "user_ocid" {
  type = string
}

variable "fingerprint" {
  type = string
}

variable "private_key_path" {
  type = string
}

variable "compartment_ocid" {
  type = string
}

variable "region" {
  type    = string
  default = "sa-saopaulo-1"
}

variable "ssh_public_key" {
  type    = string
  default = ""
}

variable "instance_shape" {
  type    = string
  default = "VM.Standard.A1.Flex"
}

variable "ocpus" {
  type    = number
  default = 4
}

variable "memory_in_gbs" {
  type    = number
  default = 24
}

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

resource "tls_private_key" "ssh" {
  count     = var.ssh_public_key == "" ? 1 : 0
  algorithm = "ED25519"
}

locals {
  ssh_public_key  = var.ssh_public_key != "" ? var.ssh_public_key : tls_private_key.ssh[0].public_key_openssh
  ssh_private_key = var.ssh_public_key == "" ? tls_private_key.ssh[0].private_key_openssh : ""
  image_id        = data.oci_core_images.ubuntu.images[0].id
  ad              = data.oci_identity_availability_domains.ads.availability_domains[0].name
}

resource "oci_core_vcn" "cloudbuilder" {
  compartment_id = var.compartment_ocid
  display_name   = "cs2-vcn"
  cidr_blocks    = ["10.0.0.0/16"]
}

resource "oci_core_security_list" "cloudbuilder" {
  compartment_id = var.compartment_ocid
  vcn_id         = oci_core_vcn.cloudbuilder.id
  display_name   = "cloudbuilder-sl"

  ingress_security_rules {
    protocol    = 6
    source      = "0.0.0.0/0"
    source_type = "CIDR_BLOCK"
    tcp_options {
      min = 22
      max = 22
    }
  }

  ingress_security_rules {
    protocol    = 6
    source      = "0.0.0.0/0"
    source_type = "CIDR_BLOCK"
    tcp_options {
      min = 80
      max = 80
    }
  }

  ingress_security_rules {
    protocol    = 6
    source      = "0.0.0.0/0"
    source_type = "CIDR_BLOCK"
    tcp_options {
      min = 443
      max = 443
    }
  }

  ingress_security_rules {
    protocol    = 6
    source      = "0.0.0.0/0"
    source_type = "CIDR_BLOCK"
    tcp_options {
      min = 3000
      max = 3000
    }
  }

  ingress_security_rules {
    protocol    = 6
    source      = "0.0.0.0/0"
    source_type = "CIDR_BLOCK"
    tcp_options {
      min = 8765
      max = 8765
    }
  }

  ingress_security_rules {
    protocol    = 17
    source      = "0.0.0.0/0"
    source_type = "CIDR_BLOCK"
    udp_options {
      min = 8765
      max = 8765
    }
  }

  egress_security_rules {
    protocol         = "all"
    destination      = "0.0.0.0/0"
    destination_type = "CIDR_BLOCK"
  }
}

resource "oci_core_subnet" "cloudbuilder" {
  compartment_id      = var.compartment_ocid
  vcn_id              = oci_core_vcn.cloudbuilder.id
  display_name        = "cloudbuilder-subnet"
  availability_domain = local.ad
  cidr_block          = "10.0.10.0/24"
  security_list_ids   = [oci_core_security_list.cloudbuilder.id]
}

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
    source_type             = "image"
    source_id               = local.image_id
    boot_volume_size_in_gbs = 100
  }

  create_vnic_details {
    subnet_id        = oci_core_subnet.cloudbuilder.id
    assign_public_ip = true
  }

  metadata = {
    ssh_authorized_keys = local.ssh_public_key
  }
}

output "instance_public_ip" {
  value = oci_core_instance.cloudbuilder.public_ip
}

output "ssh_command" {
  value = "ssh -i ~/.ssh/oci_key ubuntu@${oci_core_instance.cloudbuilder.public_ip}"
}

output "frontend_url" {
  value = "http://${oci_core_instance.cloudbuilder.public_ip}:3000"
}

output "api_url" {
  value = "http://${oci_core_instance.cloudbuilder.public_ip}:8080/api/v1"
}

output "ssh_private_key" {
  value     = local.ssh_private_key
  sensitive = true
}
