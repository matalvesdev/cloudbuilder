package parser

import (
	"testing"
)

func TestParsePlan_ValidJSON(t *testing.T) {
	input := `{
		"format_version": "1.2",
		"terraform_version": "1.9.0",
		"resource_changes": [
			{
				"address": "aws_vpc.main",
				"type": "aws_vpc",
				"name": "main",
				"provider_name": "aws",
				"change": {
					"actions": ["create"],
					"before": null,
					"after": {"cidr_block": "10.0.0.0/16"}
				}
			},
			{
				"address": "aws_instance.web",
				"type": "aws_instance",
				"name": "web",
				"provider_name": "aws",
				"change": {
					"actions": ["update"],
					"before": {"instance_type": "t2.micro"},
					"after": {"instance_type": "t3.medium"}
				}
			},
			{
				"address": "aws_s3_bucket.old",
				"type": "aws_s3_bucket",
				"name": "old",
				"provider_name": "aws",
				"change": {
					"actions": ["delete"],
					"before": {"bucket": "old-bucket"},
					"after": null
				}
			},
			{
				"address": "aws_subnet.main",
				"type": "aws_subnet",
				"name": "main",
				"provider_name": "aws",
				"change": {
					"actions": ["no-op"],
					"before": {},
					"after": {}
				}
			}
		]
	}`

	plan, err := ParsePlan(input)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}

	if plan.FormatVersion != "1.2" {
		t.Errorf("expected format_version 1.2, got %s", plan.FormatVersion)
	}
	if len(plan.ResourceChanges) != 4 {
		t.Errorf("expected 4 resource changes, got %d", len(plan.ResourceChanges))
	}
}

func TestParsePlan_InvalidJSON(t *testing.T) {
	_, err := ParsePlan("{invalid}")
	if err == nil {
		t.Fatal("expected error for invalid JSON, got nil")
	}
}

func TestPlanSummary(t *testing.T) {
	input := `{
		"format_version": "1.2",
		"resource_changes": [
			{"address":"a","type":"t","name":"n","change":{"actions":["create"]}},
			{"address":"b","type":"t","name":"n","change":{"actions":["update"]}},
			{"address":"c","type":"t","name":"n","change":{"actions":["delete"]}},
			{"address":"d","type":"t","name":"n","change":{"actions":["no-op"]}},
			{"address":"e","type":"t","name":"n","change":{"actions":["create"]}}
		]
	}`

	plan, _ := ParsePlan(input)
	added, changed, destroyed := plan.Summary()

	if added != 2 {
		t.Errorf("expected 2 added, got %d", added)
	}
	if changed != 1 {
		t.Errorf("expected 1 changed, got %d", changed)
	}
	if destroyed != 1 {
		t.Errorf("expected 1 destroyed, got %d", destroyed)
	}
}

func TestParsePlan_Empty(t *testing.T) {
	input := `{"format_version": "1.2", "resource_changes": []}`
	plan, err := ParsePlan(input)
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	added, changed, destroyed := plan.Summary()
	if added+changed+destroyed != 0 {
		t.Errorf("expected 0 total changes, got %d", added+changed+destroyed)
	}
}

func TestPlanSummary_NoActions(t *testing.T) {
	input := `{
		"format_version": "1.2",
		"resource_changes": [
			{"address":"a","type":"t","name":"n","change":{"actions":[]}}
		]
	}`
	plan, _ := ParsePlan(input)
	a, c, d := plan.Summary()
	if a != 0 || c != 0 || d != 0 {
		t.Errorf("expected 0,0,0 for empty actions, got %d,%d,%d", a, c, d)
	}
}
