package drift

import (
	"encoding/json"
	"fmt"

	"github.com/cloudbuilder/provision-engine/internal/parser"
)

type DriftResource struct {
	Address      string            `json:"address"`
	ResourceType string            `json:"resource_type"`
	Expected     string            `json:"expected"`
	Actual       string            `json:"actual"`
	ChangeType   string            `json:"change_type"`
	Changes      []PropertyChange  `json:"changes,omitempty"`
}

type PropertyChange struct {
	Property string `json:"property"`
	Expected string `json:"expected"`
	Actual   string `json:"actual"`
}

type DriftReport struct {
	HasDrift       bool            `json:"has_drift"`
	Resources      []DriftResource `json:"resources"`
	Summary        DriftSummary    `json:"summary"`
}

type DriftSummary struct {
	Added    int `json:"added"`
	Removed  int `json:"removed"`
	Modified int `json:"modified"`
}

type DesignNode struct {
	ID           string            `json:"id"`
	ResourceType string            `json:"resourceType"`
	Provider     string            `json:"provider"`
	Properties   map[string]string `json:"properties"`
}

func DetectDrift(stateJSON string, designJSON string) (*DriftReport, error) {
	state, err := parser.ParseState(stateJSON)
	if err != nil {
		return nil, fmt.Errorf("parse state: %w", err)
	}

	var designNodes []DesignNode
	if err := json.Unmarshal([]byte(designJSON), &designNodes); err != nil {
		return nil, fmt.Errorf("parse design: %w", err)
	}

	report := &DriftReport{Resources: []DriftResource{}}
	stateMap := make(map[string]*parser.StateResource)

	for i := range state.Resources {
		r := &state.Resources[i]
		addr := fmt.Sprintf("%s.%s", r.Type, r.Name)
		stateMap[addr] = r
	}

	// Check for resources in design but missing from state (added)
	for _, node := range designNodes {
		addr := fmt.Sprintf("%s.%s", node.ResourceType, node.ID)
		if _, exists := stateMap[addr]; !exists {
			report.Resources = append(report.Resources, DriftResource{
				Address:      addr,
				ResourceType: node.ResourceType,
				Expected:     "present",
				Actual:       "absent",
				ChangeType:   "added",
			})
		}
	}

	// Check for resources in state but not in design (removed)
	for addr := range stateMap {
		found := false
		for _, node := range designNodes {
			designAddr := fmt.Sprintf("%s.%s", node.ResourceType, node.ID)
			if designAddr == addr {
				found = true
				break
			}
		}
		if !found {
			report.Resources = append(report.Resources, DriftResource{
				Address:    addr,
				ChangeType: "removed",
				Expected:   "absent",
				Actual:     "present",
			})
		}
	}

	// Property-level comparison for resources present in both
	for _, node := range designNodes {
		addr := fmt.Sprintf("%s.%s", node.ResourceType, node.ID)
		sr, exists := stateMap[addr]
		if !exists {
			continue
		}

		changes := compareProperties(node.Properties, sr)
		if len(changes) > 0 {
			report.Resources = append(report.Resources, DriftResource{
				Address:      addr,
				ResourceType: node.ResourceType,
				Expected:     fmt.Sprintf("%d properties differ", len(changes)),
				Actual:       "modified",
				ChangeType:   "modified",
				Changes:      changes,
			})
		}
	}

	// Compute summary
	for _, r := range report.Resources {
		switch r.ChangeType {
		case "added":
			report.Summary.Added++
		case "removed":
			report.Summary.Removed++
		case "modified":
			report.Summary.Modified++
		}
	}

	report.HasDrift = len(report.Resources) > 0
	return report, nil
}

// compareProperties compares design properties against Terraform state attributes.
// Only compares properties present in the design (design is the source of truth).
func compareProperties(designProps map[string]string, sr *parser.StateResource) []PropertyChange {
	if len(designProps) == 0 || len(sr.Instances) == 0 {
		return nil
	}

	// Parse first instance attributes
	var attrs map[string]interface{}
	if err := json.Unmarshal(sr.Instances[0].Attributes, &attrs); err != nil {
		return nil
	}

	var changes []PropertyChange
	for key, expected := range designProps {
		actual, exists := attrs[key]
		if !exists {
			continue // property not in state, skip
		}

		actualStr := fmt.Sprintf("%v", actual)
		if actualStr != expected {
			changes = append(changes, PropertyChange{
				Property: key,
				Expected: expected,
				Actual:   actualStr,
			})
		}
	}

	return changes
}
