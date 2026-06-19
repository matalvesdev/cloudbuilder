package executor

import (
	"os"
	"path/filepath"
	"testing"
)

func TestDeploymentStatus_String(t *testing.T) {
	tests := []struct {
		status DeploymentStatus
		want   string
	}{
		{StatusPending, "PENDING"},
		{StatusInit, "INIT"},
		{StatusPlanning, "PLANNING"},
		{StatusPlanned, "PLANNED"},
		{StatusApplying, "APPLYING"},
		{StatusApplied, "APPLIED"},
		{StatusFailed, "FAILED"},
		{StatusDestroying, "DESTROYING"},
		{StatusDestroyed, "DESTROYED"},
	}

	for _, tt := range tests {
		t.Run(tt.want, func(t *testing.T) {
			if got := tt.status.String(); got != tt.want {
				t.Errorf("DeploymentStatus.String() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestNewDeploymentManager(t *testing.T) {
	e := NewExecutor(Terraform, "/tmp")
	dm := NewDeploymentManager(e)
	if dm == nil {
		t.Fatal("NewDeploymentManager() returned nil")
	}
}

func TestDeploymentManager_WriteCode(t *testing.T) {
	tmpDir := t.TempDir()
	e := NewExecutor(Terraform, tmpDir)
	dm := NewDeploymentManager(e)

	files := map[string]string{
		"main.tf":       `resource "aws_vpc" "main" {}`,
		"variables.tf":  `variable "region" {}`,
		"outputs.tf":    `output "vpc_id" {}`,
	}

	err := dm.WriteCode(files)
	if err != nil {
		t.Fatalf("WriteCode() error = %v", err)
	}

	for name := range files {
		path := filepath.Join(tmpDir, name)
		if _, err := os.Stat(path); os.IsNotExist(err) {
			t.Errorf("expected file %s to exist", path)
		}
	}
}

func TestDeploymentManager_WriteCode_NestedDirectories(t *testing.T) {
	tmpDir := t.TempDir()
	e := NewExecutor(Terraform, tmpDir)
	dm := NewDeploymentManager(e)

	files := map[string]string{
		"modules/vpc/main.tf": `resource "aws_vpc" "main" {}`,
	}

	err := dm.WriteCode(files)
	if err != nil {
		t.Fatalf("WriteCode() with nested dirs error = %v", err)
	}

	path := filepath.Join(tmpDir, "modules/vpc/main.tf")
	if _, err := os.Stat(path); os.IsNotExist(err) {
		t.Errorf("expected nested file %s to exist", path)
	}
}

func TestNewExecutor(t *testing.T) {
	e := NewExecutor(Terraform, "/tmp/work")
	if e == nil {
		t.Fatal("NewExecutor() returned nil")
	}
	if e.GetEngine() != Terraform {
		t.Errorf("GetEngine() = %v, want %v", e.GetEngine(), Terraform)
	}
	if e.GetWorkDir() != "/tmp/work" {
		t.Errorf("GetWorkDir() = %v, want /tmp/work", e.GetWorkDir())
	}
}

func TestNewExecutor_OpenTofu(t *testing.T) {
	e := NewExecutor(OpenTofu, "/tmp/tofu")
	if e.GetEngine() != OpenTofu {
		t.Errorf("GetEngine() = %v, want %v", e.GetEngine(), OpenTofu)
	}
}

func TestNewExecutor_EmptyWorkDir(t *testing.T) {
	e := NewExecutor(Terraform, "")
	if e == nil {
		t.Fatal("NewExecutor() with empty workDir returned nil")
	}
	if e.GetWorkDir() != "" {
		t.Errorf("GetWorkDir() = %v, want empty", e.GetWorkDir())
	}
}

func TestDeploymentManager_WriteCode_EmptyFiles(t *testing.T) {
	tmpDir := t.TempDir()
	e := NewExecutor(Terraform, tmpDir)
	dm := NewDeploymentManager(e)

	err := dm.WriteCode(map[string]string{})
	if err != nil {
		t.Fatalf("WriteCode() with empty files error = %v", err)
	}
}

func TestDeploymentManager_WriteCode_DeepNestedDirectories(t *testing.T) {
	tmpDir := t.TempDir()
	e := NewExecutor(Terraform, tmpDir)
	dm := NewDeploymentManager(e)

	files := map[string]string{
		"modules/networking/vpc/main.tf":          `resource "aws_vpc" "main" {}`,
		"modules/networking/subnet/public.tf":     `resource "aws_subnet" "public" {}`,
		"modules/security/firewall/rules.tf":      `resource "aws_security_group" "web" {}`,
	}

	err := dm.WriteCode(files)
	if err != nil {
		t.Fatalf("WriteCode() with deep nested dirs error = %v", err)
	}

	for name := range files {
		path := filepath.Join(tmpDir, name)
		if _, err := os.Stat(path); os.IsNotExist(err) {
			t.Errorf("expected nested file %s to exist", path)
		}
	}
}

func TestDeploymentManager_WriteCode_OverwritesExisting(t *testing.T) {
	tmpDir := t.TempDir()
	e := NewExecutor(Terraform, tmpDir)
	dm := NewDeploymentManager(e)

	// Write first version
	err := dm.WriteCode(map[string]string{"main.tf": `resource "aws_vpc" "main" {}`})
	if err != nil {
		t.Fatalf("first WriteCode() error = %v", err)
	}

	// Overwrite with different content
	err = dm.WriteCode(map[string]string{"main.tf": `resource "aws_instance" "web" {}`})
	if err != nil {
		t.Fatalf("second WriteCode() error = %v", err)
	}

	content, err := os.ReadFile(filepath.Join(tmpDir, "main.tf"))
	if err != nil {
		t.Fatalf("ReadFile() error = %v", err)
	}

	expected := `resource "aws_instance" "web" {}`
	if string(content) != expected {
		t.Errorf("expected %q, got %q", expected, string(content))
	}
}

func TestDeploymentManager_WriteCode_HugeFile(t *testing.T) {
	tmpDir := t.TempDir()
	e := NewExecutor(Terraform, tmpDir)
	dm := NewDeploymentManager(e)

	bigContent := "resource \"aws_vpc\" \"main\" {\n"
	for i := 0; i < 1000; i++ {
		bigContent += "  tag" + string(rune('a'+i%26)) + " = \"value" + string(rune('0'+i%10)) + "\"\n"
	}
	bigContent += "}\n"

	files := map[string]string{
		"big_main.tf": bigContent,
	}

	err := dm.WriteCode(files)
	if err != nil {
		t.Fatalf("WriteCode() with huge file error = %v", err)
	}

	path := filepath.Join(tmpDir, "big_main.tf")
	if _, err := os.Stat(path); os.IsNotExist(err) {
		t.Errorf("expected huge file %s to exist", path)
	}
}

func TestDeploymentStatus_OutOfRange(t *testing.T) {
	bad := DeploymentStatus(99)
	got := bad.String()
	if got != "UNKNOWN" {
		t.Errorf("DeploymentStatus.String() = %q, want %q", got, "UNKNOWN")
	}
}
