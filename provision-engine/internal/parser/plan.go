package parser

import (
	"encoding/json"
	"fmt"
)

type TerraformPlan struct {
	FormatVersion    string           `json:"format_version"`
	TerraformVersion string           `json:"terraform_version"`
	ResourceChanges  []ResourceChange `json:"resource_changes"`
	OutputChanges    map[string]Change `json:"output_changes"`
	PriorState       json.RawMessage  `json:"prior_state"`
	Configuration    json.RawMessage  `json:"configuration"`
}

type ResourceChange struct {
	Address       string `json:"address"`
	ModuleAddress string `json:"module_address"`
	Mode          string `json:"mode"`
	Type          string `json:"type"`
	Name          string `json:"name"`
	ProviderName  string `json:"provider_name"`
	Change        Change `json:"change"`
}

type Change struct {
	Actions []string        `json:"actions"`
	Before  json.RawMessage `json:"before"`
	After   json.RawMessage `json:"after"`
}

func ParsePlan(jsonInput string) (*TerraformPlan, error) {
	var plan TerraformPlan
	if err := json.Unmarshal([]byte(jsonInput), &plan); err != nil {
		return nil, fmt.Errorf("failed to parse plan JSON: %w", err)
	}
	return &plan, nil
}

func (p *TerraformPlan) Summary() (added, changed, destroyed int) {
	for _, rc := range p.ResourceChanges {
		if len(rc.Change.Actions) == 0 {
			continue
		}
		switch rc.Change.Actions[0] {
		case "create":
			added++
		case "update":
			changed++
		case "delete":
			destroyed++
		case "no-op":
		}
	}
	return
}
