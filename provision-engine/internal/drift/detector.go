package drift

import (
	"encoding/json"
	"fmt"

	"github.com/cloudbuilder/provision-engine/internal/parser"
)

type DriftResource struct {
	Address      string `json:"address"`
	ResourceType string `json:"resource_type"`
	Expected     string `json:"expected"`
	Actual       string `json:"actual"`
	ChangeType   string `json:"change_type"`
}

type DriftReport struct {
	HasDrift  bool            `json:"has_drift"`
	Resources []DriftResource `json:"resources"`
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

	report.HasDrift = len(report.Resources) > 0
	return report, nil
}
