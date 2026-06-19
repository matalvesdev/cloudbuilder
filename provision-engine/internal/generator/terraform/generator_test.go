package terraform

import (
	"strings"
	"testing"

	"github.com/cloudbuilder/provision-engine/internal/model"
)

func TestGenerate_EmptyDesign(t *testing.T) {
	g := NewGenerator()
	design := model.CanvasDesign{Nodes: []model.DesignNode{}, Edges: []model.Edge{}}

	result, err := g.Generate(design)
	if err != nil {
		t.Fatalf("Generate() error = %v", err)
	}
	if result == "" {
		t.Error("Generate() returned empty string")
	}
}

func TestGenerate_WithAwsVpc(t *testing.T) {
	g := NewGenerator()
	design := model.CanvasDesign{
		Nodes: []model.DesignNode{
			{
				ID:       "vpc1",
				Name:     "Main VPC",
				Provider: model.ProviderAWS,
				Type:     "aws_vpc",
				Properties: map[string]interface{}{
					"cidr": "10.0.0.0/16",
					"name": "main",
				},
			},
		},
		Edges: []model.Edge{},
	}

	result, err := g.Generate(design)
	if err != nil {
		t.Fatalf("Generate() error = %v", err)
	}

	if !contains(result, "aws_vpc") {
		t.Error("expected aws_vpc in generated output")
	}
	if !contains(result, "10.0.0.0/16") {
		t.Error("expected cidr block in generated output")
	}
	if !contains(result, "vpc_id_vpc1") {
		t.Error("expected vpc output in generated output")
	}
}

func TestGenerate_WithAwsInstance(t *testing.T) {
	g := NewGenerator()
	design := model.CanvasDesign{
		Nodes: []model.DesignNode{
			{
				ID:       "web1",
				Name:     "Web Server",
				Provider: model.ProviderAWS,
				Type:     "aws_instance",
				Properties: map[string]interface{}{
					"ami":          "ami-12345",
					"instanceType": "t3.large",
				},
			},
		},
	}

	result, err := g.Generate(design)
	if err != nil {
		t.Fatalf("Generate() error = %v", err)
	}

	if !contains(result, "aws_instance") {
		t.Error("expected aws_instance in generated output")
	}
	if !contains(result, "t3.large") {
		t.Error("expected instance type in generated output")
	}
	if !contains(result, "instance_public_ip_web1") {
		t.Error("expected instance output in generated output")
	}
}

func TestGenerate_WithAwsS3Bucket(t *testing.T) {
	g := NewGenerator()
	design := model.CanvasDesign{
		Nodes: []model.DesignNode{
			{
				ID:       "bucket1",
				Name:     "Assets",
				Provider: model.ProviderAWS,
				Type:     "aws_s3_bucket",
				Properties: map[string]interface{}{
					"bucketName": "my-assets",
					"versioning": true,
				},
			},
		},
	}

	result, err := g.Generate(design)
	if err != nil {
		t.Fatalf("Generate() error = %v", err)
	}

	if !contains(result, "aws_s3_bucket") {
		t.Error("expected aws_s3_bucket in generated output")
	}
	if !contains(result, "my-assets") {
		t.Error("expected bucket name in generated output")
	}
	if !contains(result, "bucket_arn_bucket1") {
		t.Error("expected bucket output in generated output")
	}
}

func TestGenerate_WithShortResourceNames(t *testing.T) {
	g := NewGenerator()
	design := model.CanvasDesign{
		Nodes: []model.DesignNode{
			{
				ID:       "vpc1",
				Name:     "VPC",
				Provider: model.ProviderAWS,
				Type:     "vpc",
				Properties: map[string]interface{}{
					"cidr": "10.0.0.0/16",
				},
			},
			{
				ID:       "ec21",
				Name:     "Server",
				Provider: model.ProviderAWS,
				Type:     "ec2",
				Properties: map[string]interface{}{
					"ami": "ami-12345",
				},
			},
			{
				ID:       "s31",
				Name:     "Bucket",
				Provider: model.ProviderAWS,
				Type:     "s3",
				Properties: map[string]interface{}{
					"bucketName": "data-lake",
				},
			},
		},
	}

	result, err := g.Generate(design)
	if err != nil {
		t.Fatalf("Generate() error = %v", err)
	}

	if !contains(result, "aws_vpc") {
		t.Error("expected aws_vpc for short name 'vpc'")
	}
	if !contains(result, "aws_instance") {
		t.Error("expected aws_instance for short name 'ec2'")
	}
	if !contains(result, "aws_s3_bucket") {
		t.Error("expected aws_s3_bucket for short name 's3'")
	}
}

func TestGenerate_WithAzureProvider(t *testing.T) {
	g := NewGenerator()
	design := model.CanvasDesign{
		Nodes: []model.DesignNode{
			{
				ID:       "vnet1",
				Name:     "VNet",
				Provider: model.ProviderAZURE,
				Type:     "azure_virtual_network",
				Properties: map[string]interface{}{
					"name": "main-vnet",
				},
			},
		},
	}

	result, err := g.Generate(design)
	if err != nil {
		t.Fatalf("Generate() error = %v", err)
	}

	if !contains(result, "azurerm") {
		t.Error("expected azurerm in generated output")
	}
}

func TestGenerate_WithGcpProvider(t *testing.T) {
	g := NewGenerator()
	design := model.CanvasDesign{
		Nodes: []model.DesignNode{
			{
				ID:       "net1",
				Name:     "GCP Network",
				Provider: model.ProviderGCP,
				Type:     "google_compute_network",
				Properties: map[string]interface{}{
					"name": "main-network",
				},
			},
		},
	}

	result, err := g.Generate(design)
	if err != nil {
		t.Fatalf("Generate() error = %v", err)
	}

	if !contains(result, "google") {
		t.Error("expected google in generated output")
	}
}

func TestGenerate_WithUnknownResourceType(t *testing.T) {
	g := NewGenerator()
	design := model.CanvasDesign{
		Nodes: []model.DesignNode{
			{
				ID:       "custom1",
				Name:     "Custom",
				Provider: model.ProviderAWS,
				Type:     "unknown_resource",
				Properties: map[string]interface{}{},
			},
		},
	}

	result, err := g.Generate(design)
	if err != nil {
		t.Fatalf("Generate() error = %v", err)
	}

	if !contains(result, "WARNING") {
		t.Error("expected WARNING for unknown resource type")
	}
	if !contains(result, "unknown_resource") {
		t.Error("expected resource type in warning message")
	}
}

func TestGenerate_WithMultipleNodes(t *testing.T) {
	g := NewGenerator()
	design := model.CanvasDesign{
		Nodes: []model.DesignNode{
			{
				ID:       "vpc1", Name: "VPC", Provider: model.ProviderAWS, Type: "aws_vpc",
				Properties: map[string]interface{}{"cidr": "10.0.0.0/16", "name": "main"},
			},
			{
				ID:       "sub1", Name: "Public Subnet", Provider: model.ProviderAWS, Type: "aws_subnet",
				Properties: map[string]interface{}{"cidr": "10.0.1.0/24", "vpcId": "vpc1"},
			},
			{
				ID:       "sg1", Name: "Web SG", Provider: model.ProviderAWS, Type: "aws_security_group",
				Properties: map[string]interface{}{"name": "web-sg"},
			},
		},
	}

	result, err := g.Generate(design)
	if err != nil {
		t.Fatalf("Generate() error = %v", err)
	}

	if !contains(result, "aws_vpc") {
		t.Error("expected aws_vpc")
	}
	if !contains(result, "aws_subnet") {
		t.Error("expected aws_subnet")
	}
	if !contains(result, "aws_security_group") {
		t.Error("expected aws_security_group")
	}
}

func TestGenerateProviderBlock_AWS(t *testing.T) {
	result := generateProviderBlock(model.ProviderAWS)
	if !contains(result, "aws") {
		t.Error("expected 'aws' in provider block")
	}
}

func TestGenerateProviderBlock_Azure(t *testing.T) {
	result := generateProviderBlock(model.ProviderAZURE)
	if !contains(result, "azurerm") {
		t.Error("expected 'azurerm' in provider block")
	}
}

func TestGenerateProviderBlock_GCP(t *testing.T) {
	result := generateProviderBlock(model.ProviderGCP)
	if !contains(result, "google") {
		t.Error("expected 'google' in provider block")
	}
}

func TestGenerateProviderBlock_Unknown(t *testing.T) {
	result := generateProviderBlock("unknown")
	if result != "" {
		t.Errorf("expected empty string, got %q", result)
	}
}

func TestGenerateHeader_ContainsTerraformBlock(t *testing.T) {
	header := generateHeader()
	if !contains(header, "required_version") {
		t.Error("expected required_version in header")
	}
	if !contains(header, "hashicorp/aws") {
		t.Error("expected hashicorp/aws in header")
	}
	if !contains(header, "data \"aws_availability_zones\"") {
		t.Error("expected data source in header")
	}
}

func TestGenerateOutputBlocks_AwsVpc(t *testing.T) {
	nodes := []model.DesignNode{
		{ID: "vpc1", Type: "aws_vpc"},
	}
	result := generateOutputBlocks(nodes)
	if !contains(result, "vpc_id_vpc1") {
		t.Error("expected vpc_id_vpc1 output")
	}
}

func TestGenerateOutputBlocks_AwsInstance(t *testing.T) {
	nodes := []model.DesignNode{
		{ID: "web1", Type: "aws_instance"},
	}
	result := generateOutputBlocks(nodes)
	if !contains(result, "instance_public_ip_web1") {
		t.Error("expected instance_public_ip_web1 output")
	}
}

func TestGenerateOutputBlocks_S3Bucket(t *testing.T) {
	nodes := []model.DesignNode{
		{ID: "bucket1", Type: "aws_s3_bucket"},
	}
	result := generateOutputBlocks(nodes)
	if !contains(result, "bucket_arn_bucket1") {
		t.Error("expected bucket_arn_bucket1 output")
	}
}

func TestGenerateOutputBlocks_UnknownType(t *testing.T) {
	nodes := []model.DesignNode{
		{ID: "custom1", Type: "unknown_type"},
	}
	result := generateOutputBlocks(nodes)
	if result != "" {
		t.Errorf("expected empty output for unknown type, got %q", result)
	}
}

func TestGenerateOutputBlocks_Empty(t *testing.T) {
	result := generateOutputBlocks([]model.DesignNode{})
	if result != "" {
		t.Errorf("expected empty output for no nodes, got %q", result)
	}
}

func contains(s, substr string) bool {
	return strings.Contains(s, substr)
}
