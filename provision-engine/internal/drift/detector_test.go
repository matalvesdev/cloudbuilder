package drift

import (
	"testing"
)

func TestDetectDrift_NoDrift(t *testing.T) {
	stateJSON := `{
		"version": 4,
		"resources": [
			{"type":"aws_vpc","name":"vpc-1","instances":[{"status":"running"}]},
			{"type":"aws_instance","name":"web-1","instances":[{"status":"running"}]}
		]
	}`
	designJSON := `[
		{"id":"vpc-1","resourceType":"aws_vpc","provider":"aws","properties":{"cidr":"10.0.0.0/16"}},
		{"id":"web-1","resourceType":"aws_instance","provider":"aws","properties":{"type":"t3.medium"}}
	]`

	report, err := DetectDrift(stateJSON, designJSON)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if report.HasDrift {
		t.Errorf("expected no drift, got %d resources", len(report.Resources))
	}
}

func TestDetectDrift_MissingResource(t *testing.T) {
	stateJSON := `{
		"version": 4,
		"resources": [
			{"type":"aws_vpc","name":"vpc-1","instances":[{"status":"running"}]}
		]
	}`
	designJSON := `[
		{"id":"vpc-1","resourceType":"aws_vpc","provider":"aws","properties":{}},
		{"id":"web-1","resourceType":"aws_instance","provider":"aws","properties":{}}
	]`

	report, err := DetectDrift(stateJSON, designJSON)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if !report.HasDrift {
		t.Fatal("expected drift to be detected")
	}
	if len(report.Resources) != 1 {
		t.Fatalf("expected 1 drifted resource, got %d", len(report.Resources))
	}
	if report.Resources[0].ChangeType != "added" {
		t.Errorf("expected change type 'added', got '%s'", report.Resources[0].ChangeType)
	}
}

func TestDetectDrift_ExtraResource(t *testing.T) {
	stateJSON := `{
		"version": 4,
		"resources": [
			{"type":"aws_vpc","name":"vpc-1","instances":[]},
			{"type":"aws_instance","name":"web-1","instances":[]},
			{"type":"aws_s3_bucket","name":"old-bucket","instances":[]}
		]
	}`
	designJSON := `[
		{"id":"vpc-1","resourceType":"aws_vpc","provider":"aws","properties":{}},
		{"id":"web-1","resourceType":"aws_instance","provider":"aws","properties":{}}
	]`

	report, err := DetectDrift(stateJSON, designJSON)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if !report.HasDrift {
		t.Fatal("expected drift for extra resource")
	}

	found := false
	for _, r := range report.Resources {
		if r.Address == "aws_s3_bucket.old-bucket" {
			found = true
			if r.ChangeType != "removed" {
				t.Errorf("expected 'removed' for extra resource, got '%s'", r.ChangeType)
			}
			break
		}
	}
	if !found {
		t.Error("expected to find aws_s3_bucket.old-bucket in drift report")
	}
}

func TestDetectDrift_Combined(t *testing.T) {
	stateJSON := `{
		"version": 4,
		"resources": [
			{"type":"aws_vpc","name":"vpc-1","instances":[]}
		]
	}`
	designJSON := `[
		{"id":"vpc-1","resourceType":"aws_vpc","provider":"aws","properties":{}},
		{"id":"new-sg","resourceType":"aws_security_group","provider":"aws","properties":{}}
	]`

	report, err := DetectDrift(stateJSON, designJSON)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if !report.HasDrift {
		t.Fatal("expected drift to be detected")
	}
	// 1 missing from state (new-sg) - aws_vpc.vpc-1 matches, so only 1 drift
	// Actually, the state has aws_vpc.vpc-1 and design has both vpc-1 and new-sg
	// Missing: aws_security_group.new-sg (in design but not in state) = 1
	// Extra: aws_vpc.vpc-1 is in both, so 0 extra
	// But wait - state has aws_vpc.vpc-1, design has aws_vpc.vpc-1 - that's a match
	// aws_security_group.new-sg is in design not in state = 1 drift (added)
	if len(report.Resources) != 1 {
		t.Fatalf("expected 1 drifted resource, got %d", len(report.Resources))
	}
}

func TestDetectDrift_InvalidState(t *testing.T) {
	_, err := DetectDrift("{invalid}", "[]")
	if err == nil {
		t.Fatal("expected error for invalid state JSON")
	}
}

func TestDetectDrift_InvalidDesign(t *testing.T) {
	stateJSON := `{"version":4,"resources":[]}`
	_, err := DetectDrift(stateJSON, "{invalid}")
	if err == nil {
		t.Fatal("expected error for invalid design JSON")
	}
}

func TestDetectDrift_EmptyDesign(t *testing.T) {
	stateJSON := `{
		"version": 4,
		"resources": [
			{"type":"aws_vpc","name":"vpc-1","instances":[]}
		]
	}`
	report, err := DetectDrift(stateJSON, "[]")
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if !report.HasDrift {
		t.Fatal("expected drift when state has resources not in design")
	}
}

func TestDetectDrift_PropertyModified(t *testing.T) {
	stateJSON := `{
		"version": 4,
		"resources": [
			{
				"type":"aws_instance",
				"name":"web",
				"instances":[{
					"status":"running",
					"attributes":{"instance_type":"t3.large","ami":"ami-123"}
				}]
			}
		]
	}`
	designJSON := `[
		{"id":"web","resourceType":"aws_instance","provider":"aws","properties":{"instance_type":"t3.medium","ami":"ami-123"}}
	]`

	report, err := DetectDrift(stateJSON, designJSON)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if !report.HasDrift {
		t.Fatal("expected property drift to be detected")
	}
	if len(report.Resources) != 1 {
		t.Fatalf("expected 1 drifted resource, got %d", len(report.Resources))
	}
	r := report.Resources[0]
	if r.ChangeType != "modified" {
		t.Errorf("expected change type 'modified', got '%s'", r.ChangeType)
	}
	if len(r.Changes) != 1 {
		t.Fatalf("expected 1 property change, got %d", len(r.Changes))
	}
	if r.Changes[0].Property != "instance_type" {
		t.Errorf("expected property 'instance_type', got '%s'", r.Changes[0].Property)
	}
	if r.Changes[0].Expected != "t3.medium" {
		t.Errorf("expected 't3.medium', got '%s'", r.Changes[0].Expected)
	}
	if r.Changes[0].Actual != "t3.large" {
		t.Errorf("expected 't3.large', got '%s'", r.Changes[0].Actual)
	}
	if report.Summary.Modified != 1 {
		t.Errorf("expected summary.modified=1, got %d", report.Summary.Modified)
	}
}

func TestDetectDrift_NoPropertyDrift(t *testing.T) {
	stateJSON := `{
		"version": 4,
		"resources": [
			{
				"type":"aws_instance",
				"name":"web",
				"instances":[{
					"status":"running",
					"attributes":{"instance_type":"t3.medium","ami":"ami-123","cidr":"10.0.0.0/16"}
				}]
			}
		]
	}`
	designJSON := `[
		{"id":"web","resourceType":"aws_instance","provider":"aws","properties":{"instance_type":"t3.medium","ami":"ami-123"}}
	]`

	report, err := DetectDrift(stateJSON, designJSON)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if report.HasDrift {
		t.Errorf("expected no drift, got %d resources", len(report.Resources))
	}
}

func TestDetectDrift_SummaryCounts(t *testing.T) {
	stateJSON := `{
		"version": 4,
		"resources": [
			{"type":"aws_vpc","name":"vpc-1","instances":[{"attributes":{"cidr":"10.0.0.0/16"}}]},
			{"type":"aws_s3_bucket","name":"extra","instances":[{}]}
		]
	}`
	designJSON := `[
		{"id":"vpc-1","resourceType":"aws_vpc","provider":"aws","properties":{"cidr":"10.1.0.0/16"}},
		{"id":"new-bucket","resourceType":"aws_s3_bucket","provider":"aws","properties":{}}
	]`

	report, err := DetectDrift(stateJSON, designJSON)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if !report.HasDrift {
		t.Fatal("expected drift")
	}
	if report.Summary.Added != 1 {
		t.Errorf("expected summary.added=1, got %d", report.Summary.Added)
	}
	if report.Summary.Removed != 1 {
		t.Errorf("expected summary.removed=1, got %d", report.Summary.Removed)
	}
	if report.Summary.Modified != 1 {
		t.Errorf("expected summary.modified=1, got %d", report.Summary.Modified)
	}
}
