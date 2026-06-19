package grpc

import (
	"context"
	"testing"

	pb "github.com/cloudbuilder/provision-engine/internal/api/grpc/proto"
)

func TestGenerateCode_EmptyDesign(t *testing.T) {
	s := NewProvisionServer()
	req := &pb.GenerateCodeRequest{
		DesignJson: `{"nodes":[],"edges":[]}`,
	}

	resp, err := s.GenerateCode(context.Background(), req)
	if err != nil {
		t.Fatalf("GenerateCode() error = %v", err)
	}

	if resp == nil {
		t.Fatal("GenerateCode() returned nil response")
	}

	if resp.ResourceCount != 0 {
		t.Errorf("ResourceCount = %d, want 0", resp.ResourceCount)
	}

	// Should have standard template files
	expectedFiles := []string{"main.tf", "variables.tf", "outputs.tf", "providers.tf", "versions.tf"}
	for _, name := range expectedFiles {
		if _, ok := resp.Files[name]; !ok {
			t.Errorf("missing expected file %s", name)
		}
	}
}

func TestGenerateCode_EmptyDesignJson(t *testing.T) {
	s := NewProvisionServer()
	req := &pb.GenerateCodeRequest{
		DesignJson: "",
	}

	_, err := s.GenerateCode(context.Background(), req)
	if err == nil {
		t.Fatal("GenerateCode() expected error for empty design_json")
	}
}

func TestGenerateCode_WithAwsVpc(t *testing.T) {
	s := NewProvisionServer()
	req := &pb.GenerateCodeRequest{
		DesignJson: `{
			"nodes": [{
				"id": "vpc1",
				"resourceType": "aws_vpc",
				"provider": "aws",
				"properties": {"cidr": "10.0.0.0/16"}
			}]
		}`,
	}

	resp, err := s.GenerateCode(context.Background(), req)
	if err != nil {
		t.Fatalf("GenerateCode() error = %v", err)
	}

	if resp.ResourceCount != 1 {
		t.Errorf("ResourceCount = %d, want 1", resp.ResourceCount)
	}

	mainTf := resp.Files["main.tf"]
	if !contains(mainTf, "aws_vpc") {
		t.Error("expected aws_vpc in main.tf")
	}
}

func TestGenerateCode_WithMultipleResourceTypes(t *testing.T) {
	s := NewProvisionServer()
	req := &pb.GenerateCodeRequest{
		DesignJson: `{
			"nodes": [
				{"id": "vpc1", "resourceType": "aws_vpc", "provider": "aws", "properties": {}},
				{"id": "web1", "resourceType": "aws_instance", "provider": "aws", "properties": {}},
				{"id": "sub1", "resourceType": "aws_subnet", "provider": "aws", "properties": {}},
				{"id": "bucket1", "resourceType": "aws_s3_bucket", "provider": "aws", "properties": {}},
				{"id": "sg1", "resourceType": "aws_security_group", "provider": "aws", "properties": {}}
			]
		}`,
	}

	resp, err := s.GenerateCode(context.Background(), req)
	if err != nil {
		t.Fatalf("GenerateCode() error = %v", err)
	}

	if resp.ResourceCount != 5 {
		t.Errorf("ResourceCount = %d, want 5", resp.ResourceCount)
	}

	mainTf := resp.Files["main.tf"]
	for _, resource := range []string{"aws_vpc", "aws_instance", "aws_subnet", "aws_s3_bucket", "aws_security_group"} {
		if !contains(mainTf, resource) {
			t.Errorf("expected %s in main.tf", resource)
		}
	}
}

func TestGenerateCode_WithUnknownResourceType(t *testing.T) {
	s := NewProvisionServer()
	req := &pb.GenerateCodeRequest{
		DesignJson: `{
			"nodes": [{
				"id": "custom1",
				"resourceType": "custom_resource",
				"provider": "aws",
				"properties": {}
			}]
		}`,
	}

	resp, err := s.GenerateCode(context.Background(), req)
	if err != nil {
		t.Fatalf("GenerateCode() error = %v", err)
	}

	if resp.ResourceCount != 1 {
		t.Errorf("ResourceCount = %d, want 1", resp.ResourceCount)
	}

	mainTf := resp.Files["main.tf"]
	if !contains(mainTf, "custom_resource") {
		t.Error("expected fallback template for unknown resource")
	}
	if !contains(mainTf, "No template for") {
		t.Error("expected 'No template for' message in fallback")
	}
}

func TestGenerateCode_WithInvalidJson(t *testing.T) {
	s := NewProvisionServer()
	req := &pb.GenerateCodeRequest{
		DesignJson: `{invalid json}`,
	}

	resp, err := s.GenerateCode(context.Background(), req)
	if err != nil {
		t.Fatalf("GenerateCode() error = %v", err)
	}

	// Should return default template with 0 resources
	if resp.ResourceCount != 0 {
		t.Errorf("ResourceCount = %d, want 0", resp.ResourceCount)
	}

	if _, ok := resp.Files["main.tf"]; !ok {
		t.Error("expected main.tf in response for invalid JSON")
	}
}

func TestGenerateCode_WithDuplicateNodes(t *testing.T) {
	s := NewProvisionServer()
	req := &pb.GenerateCodeRequest{
		DesignJson: `{
			"nodes": [
				{"id": "vpc1", "resourceType": "aws_vpc", "provider": "aws", "properties": {}},
				{"id": "vpc1", "resourceType": "aws_vpc", "provider": "aws", "properties": {}}
			]
		}`,
	}

	resp, err := s.GenerateCode(context.Background(), req)
	if err != nil {
		t.Fatalf("GenerateCode() error = %v", err)
	}

	// Should count both even if duplicates (server doesn't deduplicate)
	if resp.ResourceCount != 2 {
		t.Errorf("ResourceCount = %d, want 2", resp.ResourceCount)
	}
}

func TestApprovePlan_EmptyWorkspaceDir(t *testing.T) {
	s := NewProvisionServer()
	req := &pb.ApproveRequest{
		WorkspaceDir: "",
		DeploymentId: "dep-1",
		ApprovedBy:   "tester",
	}

	resp, err := s.ApprovePlan(context.Background(), req)
	if err != nil {
		t.Fatalf("ApprovePlan() error = %v", err)
	}

	if resp.Success {
		t.Error("ApprovePlan() should fail with empty workspace_dir")
	}
	if resp.Error == "" {
		t.Error("expected error message for empty workspace_dir")
	}
}

func TestNewProvisionServer(t *testing.T) {
	s := NewProvisionServer()
	if s == nil {
		t.Fatal("NewProvisionServer() returned nil")
	}
}

func contains(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
