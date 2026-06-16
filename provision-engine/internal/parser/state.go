package parser

import (
	"encoding/json"
	"fmt"
)

type TerraformState struct {
	Version          int             `json:"version"`
	TerraformVersion string          `json:"terraform_version"`
	Serial           int64           `json:"serial"`
	Lineage          string          `json:"lineage"`
	Resources        []StateResource `json:"resources"`
}

type StateResource struct {
	Module    string          `json:"module"`
	Mode      string          `json:"mode"`
	Type      string          `json:"type"`
	Name      string          `json:"name"`
	Provider  string          `json:"provider"`
	Instances []StateInstance `json:"instances"`
}

type StateInstance struct {
	IndexKey   interface{}     `json:"index_key"`
	Status     string          `json:"status"`
	Attributes json.RawMessage `json:"attributes"`
}

func ParseState(jsonInput string) (*TerraformState, error) {
	var state TerraformState
	if err := json.Unmarshal([]byte(jsonInput), &state); err != nil {
		return nil, fmt.Errorf("failed to parse state JSON: %w", err)
	}
	return &state, nil
}

func (s *TerraformState) ResourceCount() int {
	return len(s.Resources)
}

func (s *TerraformState) FindResource(address string) *StateResource {
	for _, r := range s.Resources {
		fullAddr := fmt.Sprintf("%s.%s", r.Type, r.Name)
		if r.Module != "" {
			fullAddr = r.Module + "." + fullAddr
		}
		if fullAddr == address {
			return &r
		}
	}
	return nil
}
