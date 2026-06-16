package templates

import (
	"fmt"
	"strings"

	"github.com/cloudbuilder/provision-engine/internal/model"
)

// ResourceTemplate generates HCL Terraform code for a given resource node.
type ResourceTemplate func(node model.DesignNode) (string, error)

// awsVpcTemplate generates an aws_vpc resource block.
func awsVpcTemplate(node model.DesignNode) (string, error) {
	cidr := getStringProp(node.Properties, "cidr", "10.0.0.0/16")
	name := getStringProp(node.Properties, "name", node.Name)

	return fmt.Sprintf(`resource "aws_vpc" "%s" {
  cidr_block           = "%s"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "%s"
    Environment = "${var.environment}"
    ManagedBy   = "CloudBuilder"
  }
}`, node.ID, cidr, name), nil
}

// awsSubnetTemplate generates an aws_subnet resource block.
func awsSubnetTemplate(node model.DesignNode) (string, error) {
	cidr := getStringProp(node.Properties, "cidr", "10.0.1.0/24")
	az := getStringProp(node.Properties, "availabilityZone", "${data.aws_availability_zones.available.names[0]}")
	name := getStringProp(node.Properties, "name", node.Name)
	public := getBoolProp(node.Properties, "public", false)

	publicStr := "false"
	if public {
		publicStr = "true"
	}

	return fmt.Sprintf(`resource "aws_subnet" "%s" {
  vpc_id                  = aws_vpc.%s.id
  cidr_block              = "%s"
  availability_zone       = "%s"
  map_public_ip_on_launch = %s

  tags = {
    Name        = "%s"
    Environment = "${var.environment}"
    ManagedBy   = "CloudBuilder"
  }
}`, node.ID, getParentVPCID(node), cidr, az, publicStr, name), nil
}

// awsSecurityGroupTemplate generates an aws_security_group resource block.
func awsSecurityGroupTemplate(node model.DesignNode) (string, error) {
	name := getStringProp(node.Properties, "name", node.Name)
	desc := getStringProp(node.Properties, "description", "Managed by CloudBuilder")

	return fmt.Sprintf(`resource "aws_security_group" "%s" {
  name        = "%s"
  description = "%s"
  vpc_id      = aws_vpc.%s.id

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["10.0.0.0/8"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "%s"
    Environment = "${var.environment}"
    ManagedBy   = "CloudBuilder"
  }
}`, node.ID, name, desc, getParentVPCID(node), name), nil
}

// awsInstanceTemplate generates an aws_instance resource block.
func awsInstanceTemplate(node model.DesignNode) (string, error) {
	ami := getStringProp(node.Properties, "ami", "ami-0c55b159cbfafe1f0")
	instanceType := getStringProp(node.Properties, "instanceType", "t3.micro")
	name := getStringProp(node.Properties, "name", node.Name)

	return fmt.Sprintf(`resource "aws_instance" "%s" {
  ami                    = "%s"
  instance_type          = "%s"
  subnet_id              = aws_subnet.%s.id
  vpc_security_group_ids = [aws_security_group.%s.id]

  associate_public_ip_address = true

  root_block_device {
    volume_type = "gp3"
    volume_size = 30
  }

  tags = {
    Name        = "%s"
    Environment = "${var.environment}"
    ManagedBy   = "CloudBuilder"
  }
}`, node.ID, ami, instanceType, getParentSubnetID(node), getParentSecurityGroupID(node), name), nil
}

// awsS3BucketTemplate generates an aws_s3_bucket resource block.
func awsS3BucketTemplate(node model.DesignNode) (string, error) {
	bucketName := getStringProp(node.Properties, "bucketName", fmt.Sprintf("%s-bucket", strings.ToLower(node.Name)))
	versioning := getBoolProp(node.Properties, "versioning", true)

	versioningStr := "false"
	if versioning {
		versioningStr = "true"
	}

	return fmt.Sprintf(`resource "aws_s3_bucket" "%s" {
  bucket = "%s"

  tags = {
    Name        = "%s"
    Environment = "${var.environment}"
    ManagedBy   = "CloudBuilder"
  }
}

resource "aws_s3_bucket_versioning" "%s_versioning" {
  bucket = aws_s3_bucket.%s.id
  versioning_configuration {
    status = "%s"
  }
}`, node.ID, bucketName, bucketName, node.ID, node.ID, versioningStr), nil
}

// GetTemplate returns the appropriate template function for a given resource type.
func GetTemplate(provider model.ProviderType, resourceType string) (ResourceTemplate, bool) {
	if provider != model.ProviderAWS {
		return nil, false
	}

	templates := map[string]ResourceTemplate{
		"aws_vpc":              awsVpcTemplate,
		"aws_subnet":           awsSubnetTemplate,
		"aws_security_group":   awsSecurityGroupTemplate,
		"aws_instance":         awsInstanceTemplate,
		"aws_s3_bucket":        awsS3BucketTemplate,
		"vpc":                  awsVpcTemplate,
		"subnet":               awsSubnetTemplate,
		"security_group":       awsSecurityGroupTemplate,
		"instance":             awsInstanceTemplate,
		"ec2":                  awsInstanceTemplate,
		"s3_bucket":            awsS3BucketTemplate,
		"s3":                   awsS3BucketTemplate,
	}

	tmpl, ok := templates[resourceType]
	return tmpl, ok
}

// --- helpers ---

func getStringProp(props map[string]interface{}, key, defaultVal string) string {
	if props == nil {
		return defaultVal
	}
	if v, ok := props[key]; ok {
		if s, ok := v.(string); ok && s != "" {
			return s
		}
	}
	return defaultVal
}

func getBoolProp(props map[string]interface{}, key string, defaultVal bool) bool {
	if props == nil {
		return defaultVal
	}
	if v, ok := props[key]; ok {
		if b, ok := v.(bool); ok {
			return b
		}
	}
	return defaultVal
}

func getParentVPCID(node model.DesignNode) string {
	if v, ok := node.Properties["vpcId"]; ok {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return "main"
}

func getParentSubnetID(node model.DesignNode) string {
	if v, ok := node.Properties["subnetId"]; ok {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return "main"
}

func getParentSecurityGroupID(node model.DesignNode) string {
	if v, ok := node.Properties["securityGroupId"]; ok {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return "main"
}
