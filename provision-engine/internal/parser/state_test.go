package parser

import (
	"testing"
)

func TestParseState_ValidJSON(t *testing.T) {
	input := `{
		"version": 4,
		"terraform_version": "1.9.0",
		"serial": 42,
		"lineage": "abc-123",
		"resources": [
			{
				"module": "",
				"mode": "managed",
				"type": "aws_vpc",
				"name": "main",
				"provider": "aws",
				"instances": [
					{"status": "running", "attributes": {"cidr_block": "10.0.0.0/16"}}
				]
			},
			{
				"module": "",
				"mode": "managed",
				"type": "aws_instance",
				"name": "web",
				"provider": "aws",
				"instances": [
					{"status": "running", "attributes": {"instance_type": "t3.medium"}}
				]
			}
		]
	}`

	state, err := ParseState(input)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}

	if state.Version != 4 {
		t.Errorf("expected version 4, got %d", state.Version)
	}
	if state.Serial != 42 {
		t.Errorf("expected serial 42, got %d", state.Serial)
	}
}

func TestParseState_InvalidJSON(t *testing.T) {
	_, err := ParseState("{bad}")
	if err == nil {
		t.Fatal("expected error for invalid JSON, got nil")
	}
}

func TestStateResourceCount(t *testing.T) {
	input := `{
		"version": 4,
		"resources": [
			{"type":"a","name":"b","instances":[]},
			{"type":"c","name":"d","instances":[]},
			{"type":"e","name":"f","instances":[]}
		]
	}`
	state, _ := ParseState(input)
	if count := state.ResourceCount(); count != 3 {
		t.Errorf("expected 3 resources, got %d", count)
	}
}

func TestStateResourceCount_Empty(t *testing.T) {
	input := `{"version": 4, "resources": []}`
	state, _ := ParseState(input)
	if count := state.ResourceCount(); count != 0 {
		t.Errorf("expected 0 resources, got %d", count)
	}
}

func TestStateFindResource(t *testing.T) {
	input := `{
		"version": 4,
		"resources": [
			{"type":"aws_vpc","name":"main","instances":[]},
			{"type":"aws_instance","name":"web","instances":[]}
		]
	}`
	state, _ := ParseState(input)

	r := state.FindResource("aws_vpc.main")
	if r == nil {
		t.Fatal("expected to find aws_vpc.main")
	}
	if r.Name != "main" {
		t.Errorf("expected name 'main', got '%s'", r.Name)
	}

	r = state.FindResource("nonexistent.resource")
	if r != nil {
		t.Errorf("expected nil for nonexistent resource, got %v", r)
	}
}

func TestStateFindResource_WithModule(t *testing.T) {
	input := `{
		"version": 4,
		"resources": [
			{"module":"module.vpc","type":"aws_vpc","name":"main","instances":[]}
		]
	}`
	state, _ := ParseState(input)

	r := state.FindResource("module.vpc.aws_vpc.main")
	if r == nil {
		t.Fatal("expected to find module.vpc.aws_vpc.main")
	}
	if r.Module != "module.vpc" {
		t.Errorf("expected module 'module.vpc', got '%s'", r.Module)
	}
}
